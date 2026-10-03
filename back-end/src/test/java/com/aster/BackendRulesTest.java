package com.aster;

import static com.aster.util.Json.*;
import static org.junit.jupiter.api.Assertions.*;

import com.aster.api.ApiException;
import com.aster.security.Passwords;
import com.aster.service.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.*;

class BackendRulesTest {
  @Test
  void tutorAcceptsGeneralQuestionsAndCoursesWithoutASelectedUnit() throws Exception {
    var ai =
        new AiProvider(
            "",
            false,
            (url, headers, body, seconds) -> {
              assertEquals("http://127.0.0.1:11434/api/chat", url);
              assertTrue(list(body.get("messages")).size() >= 2);
              return new AiProvider.Response(
                  200, map("message", map("content", "Two plus three equals five.")));
            });
    var tutor = new TutorService(new Catalogue(), ai);
    for (var extra :
        List.of(
            map(),
            map("subject", "maths"),
            map("curriculum", map("course", "ig-0580")),
            map("curriculum", map("course", "ig-0580", "unit", "algebra")),
            map("curriculum", map("course", "ig-0580", "unit", "unknown")))) {
      var input = map("message", "What is 2 plus 3?");
      input.putAll(extra);
      var reply = tutor.chat(input);
      assertEquals(true, reply.get("local"));
      assertEquals("Two plus three equals five.", reply.get("answer"));
    }
  }

  @Test
  void saltedScryptIsCompatibleWithLegacyNodeAndRejectsMalformedHashes() {
    String hash = Passwords.hash("a sufficiently long password");
    assertTrue(Passwords.verify("a sufficiently long password", hash));
    assertFalse(Passwords.verify("wrong", hash));
    assertFalse(Passwords.verify("wrong", "invalid"));
    assertFalse(Passwords.verify("wrong", null));
    assertNotEquals(hash, Passwords.hash("a sufficiently long password"));
    assertTrue(
        Passwords.verify(
            "legacy-test-password",
            "000102030405060708090a0b0c0d0e0f:11871c561f4ebddaa5787be2dbbec65804fd717676a796a788ef79dc918a2240bc70f4733b5e5ac92252a3a9515e5ad06b97c667fdfbd3aad14dbe707130c852"));
  }

  @Test
  void explicitRegistrationConsentAndContactValidation() {
    assertThrows(ApiException.class, () -> AuthService.consent(map("contact", "a@b.test")));
    assertThrows(
        ApiException.class,
        () -> AuthService.consent(map("acceptTerms", true, "contact", "invalid")));
    assertThrows(
        ApiException.class,
        () ->
            AuthService.consent(map("acceptTerms", true, "contact", "12345", "channel", "phone")));
    assertEquals(
        "phone",
        AuthService.consent(
                map("acceptTerms", true, "contact", "+491234567890", "channel", "phone"))
            .get("channel"));
    assertThrows(
        ApiException.class,
        () -> AuthService.validateCredentials(map("username", "a", "password", "longlonglong")));
  }

  @Test
  void chatValidationBoundsRoomTextAndReplyIdentifiers() {
    var good =
        map(
            "room",
            "general",
            "clientId",
            UUID.randomUUID().toString(),
            "content",
            " Hello classmates ");
    assertEquals("Hello classmates", CommunityService.validate(good).get("content"));
    for (var pair :
        List.of(
            map("room", "private-user"),
            map("content", "x".repeat(2001)),
            map("replyId", "1 OR 1=1"),
            map("clientId", "anything"))) {
      var invalid = new HashMap<>(good);
      invalid.putAll(pair);
      assertThrows(ApiException.class, () -> CommunityService.validate(invalid));
    }
  }

  @Test
  void feedDestinationsXmlAndLinksAreRestricted() throws Exception {
    for (String url :
        List.of(
            "https://example.com/news/feed/abcdefghijkl",
            "http://lms.isr-school.com/news/feed/abcdefghijkl",
            "https://lms.isr-school.com.evil.test/news/feed/abcdefghijkl",
            "https://lms.isr-school.com/news/feed/abcdefghijkl?redirect=foo",
            "https://user:pass@lms.isr-school.com/news/feed/abcdefghijkl"))
      assertThrows(IllegalArgumentException.class, () -> FeedCodec.validate(url));
    assertEquals(
        "lms.isr-school.com",
        FeedCodec.validate("https://lms.isr-school.com/news/feed/abcdefghijkl?topic=2").getHost());
    assertThrows(Exception.class, () -> FeedCodec.parseFeed("<!DOCTYPE rss><rss/>"));
    var items =
        FeedCodec.parseFeed(
            "<rss><channel><item><title>New"
                + " lesson</title><link>https://lms.isr-school.com/news/123</link><description><![CDATA[<p>Read"
                + " &amp; revise</p>]]></description><pubDate>Sun, 20 Sep 2026 10:00:00"
                + " GMT</pubDate></item><item><title>Bad</title><link>javascript:alert(1)</link></item></channel></rss>");
    assertEquals(1, items.size());
    assertEquals("Read & revise", obj(items.getFirst()).get("description"));
    assertEquals("2026-09-20T10:00:00Z", obj(items.getFirst()).get("publishedAt"));
  }

  @Test
  void feedEncryptionPreservesLegacyLayoutAndAuthenticatesCiphertext() throws Exception {
    byte[] key = new byte[32];
    String url = "https://lms.isr-school.com/news/feed/abcdefghijkl";
    String encrypted = FeedCodec.encrypt(url, key);
    assertEquals(url, FeedCodec.decrypt(encrypted, key));
    byte[] tampered = Base64.getDecoder().decode(encrypted);
    tampered[15] ^= 1;
    assertThrows(
        Exception.class,
        () -> FeedCodec.decrypt(Base64.getEncoder().encodeToString(tampered), key));
    assertEquals(
        url,
        FeedCodec.decrypt(
            "AAAAAAAAAAAAAAAA/bXNJXO3+7OCeCZCW0Bdz6bTNE0+WkRBayO2/dOA7zUBA2ulWMoEF77P2uAQcUahuy/UTGIrgxgljT9DL2VcnCs=",
            key));
  }

  @Test
  void aiCloudRequiresConfigurationAndConsentBeforeNetwork() {
    AtomicInteger calls = new AtomicInteger();
    AiProvider.Transport unexpected =
        (url, headers, body, seconds) -> {
          calls.incrementAndGet();
          throw new Exception();
        };
    for (var provider :
        List.of(new AiProvider("", true, unexpected), new AiProvider("test", false, unexpected))) {
      assertThrows(
          ApiException.class, () -> provider.complete("openai", true, List.of(), null, 1000, 2));
    }
    assertThrows(
        ApiException.class,
        () ->
            new AiProvider("test", true, unexpected)
                .complete("openai", false, List.of(), null, 1000, 2));
    assertEquals(0, calls.get());
  }

  @Test
  void cloudRequestPreservesConsentSchemaImagesAndNoStore() {
    var ai =
        new AiProvider(
            "test",
            true,
            (url, headers, body, seconds) -> {
              assertEquals("https://api.openai.com/v1/responses", url);
              assertEquals(false, body.get("store"));
              assertEquals(AiProvider.CLOUD_MODEL, body.get("model"));
              assertEquals("medium", obj(body.get("reasoning")).get("effort"));
              assertFalse(body.containsKey("temperature"));
              assertEquals(true, obj(obj(body.get("text")).get("format")).get("strict"));
              var message = obj(list(body.get("input")).getFirst());
              assertTrue(
                  str(obj(list(message.get("content")).get(1)).get("image_url"))
                      .startsWith("data:image/png"));
              return new AiProvider.Response(
                  200,
                  map(
                      "output",
                      List.of(
                          map("content", List.of(map("type", "output_text", "text", "answer"))))));
            });
    assertFalse(
        ai.complete(
                "openai",
                true,
                List.of(
                    map(
                        "role",
                        "user",
                        "content",
                        "Read",
                        "images",
                        List.of("data:image/png;base64,iVBORw0KGgo="))),
                map("type", "object"),
                1000,
                2)
            .local());
  }

  @Test
  void cloudRefusalsIncompleteResponsesAndRateLimitsAreErrors() {
    for (var payload :
        List.of(
            map("status", "incomplete"),
            map("output", List.of(map("content", List.of(map("type", "refusal"))))))) {
      var ai = new AiProvider("test", true, (u, h, b, t) -> new AiProvider.Response(200, payload));
      assertThrows(ApiException.class, () -> ai.complete("openai", true, List.of(), null, 1000, 2));
    }
    var ai = new AiProvider("test", true, (u, h, b, t) -> new AiProvider.Response(429, map()));
    assertEquals(
        429,
        assertThrows(
                ApiException.class, () -> ai.complete("openai", true, List.of(), null, 1000, 2))
            .status);
  }

  @Test
  void localAiIsDefaultAndRemovesImageHeader() {
    var ai =
        new AiProvider(
            "",
            false,
            (url, headers, body, seconds) -> {
              assertEquals("http://127.0.0.1:11434/api/chat", url);
              assertEquals("qwen3.5:2b", body.get("model"));
              assertEquals(
                  "abc", list(obj(list(body.get("messages")).getFirst()).get("images")).getFirst());
              return new AiProvider.Response(200, map("message", map("content", "A local answer")));
            });
    assertTrue(
        ai.complete(
                "",
                false,
                List.of(
                    map(
                        "role",
                        "user",
                        "content",
                        "Read",
                        "images",
                        List.of("data:image/png;base64,abc"))),
                null,
                700,
                2)
            .local());
  }

  @Test
  void examInputRejectsUnconfirmedPracticeFakeImagesAndExcessPages() {
    for (var b :
        List.of(
            map("subject", "Maths", "images", List.of("data:image/svg+xml;base64,YQ==")),
            map("subject", "Maths", "images", List.of("data:image/png;base64,YQ==")),
            map("subject", "Maths", "images", List.of("x", "x", "x", "x", "x")),
            map("subject", "Maths", "text", "tiny")))
      assertThrows(ApiException.class, () -> ExamCoachService.validate(b, "read"));
    assertThrows(
        ApiException.class,
        () ->
            ExamCoachService.validate(
                map("subject", "Maths", "text", "Some readable question"), "practice"));
    assertEquals(
        1,
        list(ExamCoachService.validate(
                    map(
                        "subject",
                        "Maths",
                        "images",
                        List.of("data:image/png;base64,iVBORw0KGgo=")),
                    "read")
                .get("images"))
            .size());
  }

  @Test
  void coachingRequiresEvidenceAndUnambiguousChoices() {
    var q =
        map(
            "topic",
            "Algebra",
            "question",
            "Solve x+2=6",
            "choices",
            List.of("2", "3", "4", "5"),
            "answerIndex",
            2,
            "explanation",
            "Subtract 2 from both sides.");
    assertEquals(
        3,
        list(ExamCoachService.normalizePractice(map("questions", List.of(q, q, q)))
                .get("questions"))
            .size());
    var bad = new HashMap<>(q);
    bad.put("choices", List.of("2", "2", "4", "5"));
    assertThrows(
        ApiException.class,
        () -> ExamCoachService.normalizePractice(map("questions", List.of(bad, q, q))));
    assertEquals(
        List.of(),
        ExamCoachService.normalizeRead(
                map(
                    "readable",
                    true,
                    "transcription",
                    "Some text",
                    "weaknesses",
                    List.of(map("topic", "Unsupported"))))
            .get("weaknesses"));
  }

  @Test
  void equationCheckRepairsWrongKeysAndRejectsNoOrMultipleCorrectAnswers() {
    var q =
        map(
            "question",
            "What is x in 5x + 3 = 18?",
            "choices",
            List.of("2.6", "3.4", "3.8", "4"),
            "answerIndex",
            0,
            "explanation",
            "Incorrect");
    assertThrows(ApiException.class, () -> ExamCoachService.checkEquation(q));
    q.put("choices", List.of("2", "3", "4", "5"));
    assertEquals(1, ExamCoachService.checkEquation(q).get("answerIndex"));
    q.put("choices", List.of("3", "3.0", "4", "5"));
    assertThrows(ApiException.class, () -> ExamCoachService.checkEquation(q));
  }

  @Test
  void verifiedAlgebraAvoidsModelCalls() throws Exception {
    var ai =
        new AiProvider(
            "",
            false,
            (u, h, b, t) -> {
              throw new AssertionError("Should use verified bank");
            });
    var coach = new ExamCoachService(ai, new Catalogue());
    var result =
        coach.analyse(
            map(
                "subject",
                "Mathematics",
                "text",
                "Student solved 3x + 6 = 18 by adding 6 instead of subtracting.",
                "topics",
                List.of(
                    map(
                        "topic",
                        "Algebraic Equation Solving",
                        "evidence",
                        "Incorrect inverse operation"))),
            "practice");
    assertEquals("verified-bank", result.get("practiceSource"));
    var questions = list(result.get("questions"));
    assertEquals(3, questions.size());
    assertEquals(3, questions.stream().map(q -> obj(q).get("question")).distinct().count());
    for (Object raw : questions) {
      var q = obj(raw);
      assertEquals(q.get("answerIndex"), ExamCoachService.checkEquation(q).get("answerIndex"));
    }
  }

  @Test
  void mockGenerationAndMarkingMatchSelectedTopics() throws Exception {
    var service = new ExamService(null, new Catalogue());
    var plan =
        map(
            "title",
            "Algebra rehearsal",
            "date",
            "2026-09-21",
            "minutes",
            30,
            "course",
            "ig-0580",
            "topics",
            List.of("algebra", "quadratics"),
            "cards",
            List.of());
    var mock = service.build(plan);
    assertEquals(4, list(mock.get("questions")).size());
    assertEquals(6, mock.get("totalMarks"));
    var marked =
        ExamService.mark(
            mock,
            map(
                "algebra-check",
                1,
                "quadratics-check",
                0,
                "algebra-explain",
                "Use equal operations."));
    assertEquals(1, marked.get("correct"));
    assertEquals(2, marked.get("objective"));
    assertEquals(2, marked.get("written"));
    assertEquals(3, marked.get("answered"));
    for (var change :
        List.of(
            map("date", "2026-02-30"),
            map("topics", List.of("cells")),
            map("minutes", 0),
            map("topics", List.of()),
            map("cards", List.of(map("question", "Q", "answer", "A"))))) {
      var bad = new HashMap<>(plan);
      bad.putAll(change);
      assertThrows(ApiException.class, () -> service.validate(bad));
    }
    var written =
        service.build(
            map(
                "title",
                "Networks",
                "date",
                "2026-09-22",
                "minutes",
                15,
                "cards",
                List.of(map("question", "What is LAN?", "answer", "Local Area Network"))));
    assertEquals("written", obj(list(written.get("questions")).getFirst()).get("type"));
    assertEquals(0, ExamService.mark(written, map("card-0", "Anything")).get("correct"));
  }
}
