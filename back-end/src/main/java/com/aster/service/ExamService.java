package com.aster.service;

import static com.aster.util.Json.*;

import com.aster.api.ApiException;
import com.aster.persistence.ExamMapper;
import java.time.*;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ExamService {
  private final ExamMapper db;
  private final Catalogue catalogue;

  public ExamService(ExamMapper db, Catalogue catalogue) {
    this.db = db;
    this.catalogue = catalogue;
  }

  public Map<String, Object> validate(Map<String, Object> b) {
    String title = text(b.get("title"), 120), date = str(b.get("date"));
    if (title.isEmpty()) throw ApiException.bad("Give your exam a title.");
    try {
      if (!date.matches("\\d{4}-\\d{2}-\\d{2}") || !LocalDate.parse(date).toString().equals(date))
        throw new IllegalArgumentException();
    } catch (Exception e) {
      throw ApiException.bad("Choose a valid exam date.");
    }
    if (date.compareTo("2020-01-01") < 0 || date.compareTo("2040-12-31") > 0)
      throw ApiException.bad("Choose an exam year between 2020 and 2040.");
    var course = catalogue.course(b.get("course"));
    var topics =
        list(b.get("topics")).stream()
            .distinct()
            .limit(40)
            .filter(id -> catalogue.units.containsKey(str(id)))
            .toList();
    if (!topics.isEmpty()
        && (course.isEmpty()
            || topics.stream().anyMatch(id -> !list(course.get("units")).contains(id))))
      throw ApiException.bad("Choose topics from the selected subject.");
    var cards = new ArrayList<Object>();
    for (Object raw : list(b.get("cards")).stream().limit(40).toList()) {
      var c = obj(raw);
      String q = text(c.get("question"), 800), a = text(c.get("answer"), 1500);
      if (q.isEmpty() || a.isEmpty())
        throw ApiException.bad("Each study card needs a question and answer.");
      cards.add(map("question", q, "answer", a, "explanation", text(c.get("explanation"), 1500)));
    }
    if (topics.isEmpty() && cards.isEmpty())
      throw ApiException.bad("Select at least one topic or a study set.");
    if (!topics.isEmpty() && !cards.isEmpty())
      throw ApiException.bad("Choose one study-list source for each exam.");
    Object minutes = b.get("minutes");
    if (!integer(minutes) || number(minutes) < 5 || number(minutes) > 180)
      throw ApiException.bad("Choose a duration from 5 to 180 minutes.");
    String source = text(b.get("source"), 120);
    if (source.isEmpty()) source = course.isEmpty() ? "My study set" : str(course.get("name"));
    return map(
        "title",
        title,
        "date",
        date,
        "source",
        source,
        "course",
        course.getOrDefault("id", ""),
        "topics",
        topics,
        "cards",
        cards,
        "minutes",
        number(minutes));
  }

  public Map<String, Object> build(Map<String, Object> input) {
    var p = validate(input);
    var questions = new ArrayList<Object>();
    int marks = 0;
    for (Object id : list(p.get("topics"))) {
      var u = obj(catalogue.units.get(str(id)));
      questions.add(
          map(
              "id",
              id + "-check",
              "topic",
              u.get("title"),
              "type",
              "choice",
              "question",
              u.get("q"),
              "options",
              u.get("options"),
              "answer",
              u.get("a"),
              "explanation",
              u.get("why"),
              "marks",
              1));
      questions.add(
          map(
              "id",
              id + "-explain",
              "topic",
              u.get("title"),
              "type",
              "written",
              "question",
              "Explain "
                  + str(u.get("title")).toLowerCase(Locale.ROOT)
                  + ". Use a specific example to support your explanation.",
              "answer",
              u.get("concept") + "\n\nExample: " + u.get("example"),
              "criteria",
              List.of(
                  "Explain the main concept accurately.",
                  "Use a relevant example and connect it to the explanation."),
              "marks",
              2));
      marks += 3;
    }
    int i = 0;
    for (Object raw : list(p.get("cards"))) {
      var c = obj(raw);
      String explanation = str(c.get("explanation"));
      questions.add(
          map(
              "id",
              "card-" + (i++),
              "topic",
              p.get("source"),
              "type",
              "written",
              "question",
              c.get("question"),
              "answer",
              c.get("answer") + (explanation.isEmpty() ? "" : "\n\n" + explanation),
              "criteria",
              List.of(
                  "Give an accurate answer matching the key idea.",
                  "Explain your reasoning or include a relevant detail."),
              "marks",
              2));
      marks += 2;
    }
    return map(
        "version",
        1,
        "questions",
        questions,
        "totalMarks",
        marks,
        "source",
        p.get("source"),
        "createdAt",
        Instant.now().toString());
  }

  public static Map<String, Object> mark(
      Map<String, Object> blueprint, Map<String, Object> answers) {
    int correct = 0, objective = 0, answered = 0, written = 0;
    Set<Object> review = new LinkedHashSet<>();
    for (Object raw : list(blueprint.get("questions"))) {
      var q = obj(raw);
      Object v = answers.get(str(q.get("id")));
      if ("choice".equals(q.get("type"))) {
        objective++;
        if (integer(v) && number(v) == number(q.get("answer"))) correct++;
        else review.add(q.get("topic"));
        if (integer(v) && number(v) >= 0 && number(v) < list(q.get("options")).size()) answered++;
      } else {
        written++;
        if (!str(v).trim().isEmpty()) answered++;
      }
    }
    return map(
        "correct",
        correct,
        "objective",
        objective,
        "written",
        written,
        "answered",
        answered,
        "total",
        list(blueprint.get("questions")).size(),
        "review",
        new ArrayList<>(review));
  }

  @Scheduled(fixedDelay = 60000, initialDelay = 15000)
  public void scheduled() {
    try {
      prepare();
    } catch (Exception ignored) {
    }
  }

  public void prepare() {
    for (var row : db.due(LocalDate.now(ZoneId.of("Europe/Berlin")).toString())) {
      try {
        db.generate(str(row.get("id")), write(build(obj(parse(row.get("plan"))))));
      } catch (ApiException e) {
        /* A malformed legacy plan remains editable. */
      }
    }
  }

  public Map<String, Object> listExams(String user) {
    prepare();
    var exams = new ArrayList<Object>();
    for (var row : db.list(user)) {
      var p = obj(parse(row.get("plan")));
      p.putAll(
          map(
              "id",
              row.get("id"),
              "blueprint",
              parse(row.get("blueprint")),
              "result",
              parse(row.get("result")),
              "generatedAt",
              row.get("generatedAt")));
      exams.add(p);
    }
    return map("exams", exams, "automatic", true);
  }

  public Map<String, Object> add(String user, Map<String, Object> b) {
    var p = validate(b);
    if (db.count(user) >= 100) throw ApiException.bad("Keep at most 100 active exam plans.");
    db.add(UUID.randomUUID().toString(), user, str(p.get("date")), write(p));
    return listExams(user);
  }

  public Map<String, Object> action(String user, String id, Map<String, Object> b) {
    var row = db.find(id, user);
    if (row == null) throw new ApiException(404, "Exam plan not found.");
    switch (str(b.get("action"))) {
      case "generate" -> {
        if (row.get("blueprint") == null)
          db.generate(id, write(build(obj(parse(row.get("plan"))))));
        return listExams(user);
      }
      case "remove" -> {
        db.remove(id, user);
        return listExams(user);
      }
      case "submit" -> {
        if (row.get("blueprint") == null)
          throw ApiException.bad("Generate the mock exam before starting.");
        var blueprint = obj(parse(row.get("blueprint")));
        var input = obj(b.get("answers"));
        var answers = new LinkedHashMap<String, Object>();
        for (Object raw : list(blueprint.get("questions"))) {
          var q = obj(raw);
          String qid = str(q.get("id"));
          Object v = input.get(qid);
          answers.put(
              qid, "choice".equals(q.get("type")) ? (integer(v) ? v : null) : text(v, 6000));
        }
        var result = mark(blueprint, answers);
        result.putAll(map("answers", answers, "finishedAt", Instant.now().toString()));
        boolean first = db.submit(id, user, write(result)) == 1;
        return map(
            "result",
            first ? result : parse(db.find(id, user).get("result")),
            "firstSubmission",
            first);
      }
      default -> throw ApiException.bad("Choose a valid mock-exam action.");
    }
  }
}
