import {EXTRA_COMPETITIONS} from './competitionExtras.js';
const amc='https://maa.org/student-programs/amc/',ukmt='https://ukmt.org.uk/competitions',cemc='https://cemc.uwaterloo.ca/contests/pcf';
export const COMPETITIONS=[
 ...EXTRA_COMPETITIONS,
 ['amc8','AMC 8','Mathematics','Junior','MAA','Grade 8 or below; under 14.5 on contest day.','Number sense, geometry, counting, and inventive problem solving.',amc,amc],
 ['amc10','AMC 10','Mathematics','Intermediate','MAA','Grade 10 or below; under 17.5 on contest day.','Algebra, geometry, probability, and mathematical reasoning.',amc,amc],
 ['amc12','AMC 12','Mathematics','Advanced','MAA','Grade 12 or below; under 19.5 on contest day.','An advanced challenge across secondary-school mathematics.',amc,amc],
 ['kangaroo','Math Kangaroo','Mathematics','All levels','Känguru der Mathematik','Germany: classes 3–13; entry is arranged through school.','Short, surprising multiple-choice problems that reward flexible thinking.','https://www.mathe-kaenguru.de/wettbewerb/','https://www.mathe-kaenguru.de/chronik/aufgaben/'],
 ['ukmt-j','UKMT Junior Challenge','Mathematics','Junior','UK Mathematics Trust','UK school Year 8 or below; check international entry rules.','Build mathematical reasoning through carefully designed problems.',ukmt,ukmt],
 ['ukmt-i','UKMT Intermediate Challenge','Mathematics','Intermediate','UK Mathematics Trust','Intermediate school stage; confirm your eligibility with the organiser.','Stretch your algebra, geometry, and problem-solving strategies.',ukmt,ukmt],
 ['ukmt-s','UKMT Senior Challenge','Mathematics','Advanced','UK Mathematics Trust','UK Year 13 or below; confirm international entry rules.','A route into more demanding mathematical challenges.',ukmt,ukmt],
 ['gauss','Gauss Contests','Mathematics','Junior','University of Waterloo · CEMC','Designed for Grades 7 and 8; younger motivated students can enter.','Accessible problems that encourage curiosity and logical thinking.','https://cemc.uwaterloo.ca/contests/gauss','https://cemc.uwaterloo.ca/resources/past-contests'],
 ['pascal','Pascal Contest','Mathematics','Intermediate','University of Waterloo · CEMC','Grade 9 preparation; check current organiser rules.','Develop a broader set of mathematical tools and approaches.',cemc,'https://cemc.uwaterloo.ca/resources/past-contests'],
 ['cayley','Cayley Contest','Mathematics','Intermediate','University of Waterloo · CEMC','Grade 10 preparation; check current organiser rules.','Explore problems that combine familiar ideas in unfamiliar ways.',cemc,'https://cemc.uwaterloo.ca/resources/past-contests'],
 ['fermat','Fermat Contest','Mathematics','Advanced','University of Waterloo · CEMC','Grade 11 preparation; check current organiser rules.','A deeper challenge in reasoning and mathematical fluency.',cemc,'https://cemc.uwaterloo.ca/resources/past-contests'],
 ['olympiad','Mathematik-Olympiade','Mathematics','All levels','Mathematik-Olympiaden','Grade-based rounds in Germany; local entry arrangements apply.','Work on proofs, clear explanations, and original solutions.','https://www.mathematik-olympiaden.de/','https://www.mathematik-olympiaden.de/'],
 ['biber','Informatik-Biber','Computing','Junior','BWINF','Grade-based categories; check your school’s participation.','Computational thinking and logic without requiring a programming background.','https://bwinf.de/biber/','https://bwinf.de/biber/'],
 ['jwinf','Jugendwettbewerb Informatik','Computing','Intermediate','BWINF','Check the current round and participation conditions.','A practical next step into programming and algorithms.','https://bwinf.de/jugendwettbewerb/','https://bwinf.de/jugendwettbewerb/'],
 ['bwinf','Bundeswettbewerb Informatik','Computing','Advanced','BWINF','Advanced school programming; current eligibility rules apply.','Solve substantial programming problems and explain your approach.','https://bwinf.de/bundeswettbewerb/','https://bwinf.de/bundeswettbewerb/'],
 ['ijso','Junior Science Olympiad','Science','Intermediate','ScienceOlympiaden · Germany','Age and school eligibility depend on the competition year.','Combine biology, chemistry, and physics through investigation.','https://www.scienceolympiaden.de/ijso','https://www.scienceolympiaden.de/ijso'],
 ['research','Jugend forscht','Science','All levels','Stiftung Jugend forscht','From class 4 to age 21, with separate age categories.','Choose your own research question and develop a scientific project.','https://www.jugend-forscht.de/','https://www.jugend-forscht.de/'],
 ['robotics','FIRST LEGO League','Robotics','All levels','HANDS on TECHNOLOGY','Different programmes serve different ages; check your local event.','Teamwork, robotics, research, and an original project.','https://www.first-lego-league.org/en/','https://www.first-lego-league.org/en/']
].map(([id,name,subject,level,organizer,eligibility,description,url,practice])=>({id,name,subject,level,organizer,eligibility,description,url,practice}));
export const CONTEST_PRACTICE={
 Junior:[
 ['A rectangle has perimeter 34 cm. Its length is 5 cm more than its width. What is its area?',['54 cm²','60 cm²','66 cm²','84 cm²'],2,'If the width is w, 2(w+w+5)=34. So w=6, length=11, and area=66 cm².'],
 ['How many integers from 1 to 30 inclusive are divisible by 3 or 5?',['12','14','16','18'],1,'There are 10 multiples of 3 and 6 multiples of 5. Subtract the 2 multiples of 15 counted twice: 10+6−2=14.'],
 ['The mean of five numbers is 18. One number, 14, is replaced by 24. What is the new mean?',['19','20','22','28'],1,'The total increases by 10. Shared across 5 numbers, the mean increases by 2 to 20.']
 ],
 Intermediate:[
 ['For nonzero x, x + 1/x = 3. What is x² + 1/x²?',['5','7','9','11'],1,'Square the equation: x²+2+1/x²=9. Subtract 2 to obtain 7.'],
 ['A bag contains 3 red and 2 blue counters. Two are drawn without replacement. What is the probability both are red?',['1/5','3/10','2/5','9/25'],1,'The first counter is red with probability 3/5, then 2/4 of the remaining counters are red. Multiply: 3/5 × 2/4 = 3/10.'],
 ['The roots of x² − 5x + 3 = 0 are r and s. What is r² + s²?',['13','19','22','25'],1,'The sum r+s is 5 and the product rs is 3. So r²+s²=(r+s)²−2rs=25−6=19.']
 ],
 Advanced:[
 ['Let i² = −1. What is (1+i)⁸?',['−16','16','16i','−16i'],1,'(1+i)²=2i, so (1+i)⁴=−4, and its eighth power is 16.'],
 ['For x > 2, log₂(x) + log₂(x−2) = 3. Find x.',['3','4','5','6'],1,'Combine logs: x(x−2)=8. Then x²−2x−8=0 gives x=4 or −2. Only 4 is in the domain.'],
 ['How many different groups of 3 can be chosen from 8 students?',['24','48','56','336'],2,'Order does not matter: 8 choose 3 = (8×7×6)/(3×2×1)=56.']
 ]
};
