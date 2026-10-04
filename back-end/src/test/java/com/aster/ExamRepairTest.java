package com.aster;

import static com.aster.util.Json.*;
import static org.junit.jupiter.api.Assertions.*;
import com.aster.api.ApiException;
import com.aster.service.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class ExamRepairTest {
  @Test void correctionRequiresCheckedSourceAndNewWorking() {
    var b=map("subject","Mathematics","question","Solve 2x + 3 = 11.","attempt","x = 4");
    assertThrows(ApiException.class,()->ExamCoachService.validate(b,"repair"));
    b.put("confirmed",true);
    assertEquals("x = 4",ExamCoachService.validate(b,"repair").get("attempt"));
    b.put("attempt"," ");assertThrows(ApiException.class,()->ExamCoachService.validate(b,"repair"));
  }
  @Test void correctionUsesRealProviderContractAndRejectsIncompleteFeedback() throws Exception {
    var ai=new AiProvider("",false,(url,headers,body,seconds)->{
      assertEquals("http://127.0.0.1:11434/api/chat",url);
      var messages=list(body.get("messages"));
      assertTrue(str(obj(messages.get(0)).get("content")).contains("untrusted reference material"));
      assertTrue(str(obj(messages.get(1)).get("content")).contains("Subtract 3 from both sides"));
      assertTrue(obj(body.get("format")).containsKey("properties"));
      return new AiProvider.Response(200,map("message",map("content",write(map("verdict","improved",
          "feedback","Both steps are correct.","nextStep","Try another linear equation.",
          "suggestedAnswer","2x = 8, so x = 4.")))));
    });
    var coach=new ExamCoachService(ai,new Catalogue());
    var result=coach.analyse(map("subject","Mathematics","question","Explain why inverse operations keep equations balanced.",
        "attempt","Subtract 3 from both sides, then divide by 2: x = 4.","confirmed",true),"repair");
    assertEquals("improved",result.get("verdict"));
    assertThrows(ApiException.class,()->ExamCoachService.normalizeRepair(map("verdict","improved")));
    assertThrows(ApiException.class,()->ExamCoachService.normalizeRepair(map("verdict","A+","feedback","Perfect")));
  }
  @Test void simpleAlgebraUsesArithmeticAndDoesNotApproveWrongOrContradictoryValues() {
    var correct=ExamCoachService.verifiedRepair(map("question","Solve 2x + 3 = 11.","attempt","Subtract 3 from both sides: 2x = 8. Divide by 2: x = 4."));
    assertEquals("improved",correct.get("verdict"));
    assertEquals("verified-algebra",correct.get("source"));
    assertTrue(str(correct.get("suggestedAnswer")).contains("2x = 8"));
    assertEquals("revisit",ExamCoachService.verifiedRepair(map("question","Solve 2x + 3 = 11.","attempt","x = 7")).get("verdict"));
    assertEquals("revisit",ExamCoachService.verifiedRepair(map("question","Solve 2x + 3 = 11.","attempt","x = 7 or x = 4")).get("verdict"));
    assertEquals("improved",ExamCoachService.verifiedRepair(map("question","Solve -2x - 3 = 5","attempt","x = -4")).get("verdict"));
    assertNull(ExamCoachService.verifiedRepair(map("question","Solve 2x + 3 = 11 modulo 5","attempt","x = 4")));
    assertNull(ExamCoachService.verifiedRepair(map("question","Solve 0x + 3 = 5","attempt","x = 4")));
  }
  @Test void extractedQuestionsKeepSourceTextWithoutInventingMissingTeacherFeedback() {
    var result=ExamCoachService.normalizeRead(map("readable",true,"transcription","Q1 solve x + 3 = 9.",
        "weaknesses",List.of(),"mistakes",List.of(map("questionNumber","1","question","Solve x + 3 = 9.",
          "originalAnswer","x = 12"),map("question",""))));
    assertEquals(1,list(result.get("mistakes")).size());
    assertEquals("",obj(list(result.get("mistakes")).getFirst()).get("teacherFeedback"));
  }
  @Test void birthdayValidationRejectsImpossibleAndFutureDates() {
    assertEquals("2012-02-29",AuthService.validateBirthday("2012-02-29"));
    for(String d:List.of("2011-02-29","2200-01-01","1899-01-01",""))
      assertThrows(ApiException.class,()->AuthService.validateBirthday(d));
  }
}
