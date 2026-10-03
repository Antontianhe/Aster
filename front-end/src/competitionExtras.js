const waterloo='University of Waterloo · CEMC',archive='https://cemc.uwaterloo.ca/resources/past-contests',uk='https://ukmt.org.uk/competitions',papers='https://ukmt.org.uk/competition-papers';
const c=(id,name,level,url,grade)=>[id,name,'Mathematics',level,waterloo,grade+' preparation. Confirm current entry and overseas arrangements with the organiser.','Build clear mathematical reasoning through official contest problems.',url,archive];
const u=(id,name,level,description)=>[id,name,'Mathematics',level,'UK Mathematics Trust','Check the organiser for school entry, qualification routes, and eligibility.',description,uk,papers];
export const EXTRA_COMPETITIONS=[
 c('fryer','Fryer Contest','Intermediate','https://cemc.uwaterloo.ca/contests/fgh','Grade 9'),
 c('galois','Galois Contest','Intermediate','https://cemc.uwaterloo.ca/contests/fgh','Grade 10'),
 c('hypatia','Hypatia Contest','Advanced','https://cemc.uwaterloo.ca/contests/fgh','Grade 11'),
 c('euclid','Euclid Contest','Advanced','https://cemc.uwaterloo.ca/contests/euclid','Grade 12'),
 c('cimc','Canadian Intermediate Mathematics Contest','Intermediate','https://cemc.uwaterloo.ca/contests/csimc','Intermediate secondary'),
 c('csmc','Canadian Senior Mathematics Contest','Advanced','https://cemc.uwaterloo.ca/contests/csimc','Senior secondary'),
 c('ctmc','Canadian Team Mathematics Contest','Advanced','https://cemc.uwaterloo.ca/contests','Secondary team'),
 ['bcc','Beaver Computing Challenge','Computing','Junior',waterloo,'School computing challenge; categories cover Grades 5–10.','Explore logic and computational thinking.','https://cemc.uwaterloo.ca/contests',archive],
 ['ccc','Canadian Computing Competition','Computing','Advanced',waterloo,'Junior and Senior divisions; check organiser entry rules.','Programming problems, algorithms, and careful testing.','https://cemc.uwaterloo.ca/contests',archive],
 u('uk-jmo','Junior Mathematical Olympiad','Junior','Explore proof and written solutions after the junior challenge.'),
 u('uk-jk','Junior Kangaroo','Junior','A further set of short mathematical challenges.'),
 u('uk-grey','Grey Kangaroo','Intermediate','Develop speed and reasoning on intermediate problems.'),
 u('uk-pink','Pink Kangaroo','Intermediate','Extend your intermediate mathematical problem solving.'),
 u('uk-cayley','Cayley Mathematical Olympiad','Intermediate','Build confidence with full mathematical arguments.'),
 u('uk-hamilton','Hamilton Mathematical Olympiad','Intermediate','Work on multi-step proofs and unfamiliar problems.'),
 u('uk-maclaurin','Maclaurin Mathematical Olympiad','Advanced','Stretch your written mathematical reasoning.'),
 u('uk-senior-k','Andrew Jobbings Senior Kangaroo','Advanced','A follow-on senior mathematical challenge.'),
 u('bmo1','British Mathematical Olympiad · Round 1','Advanced','Tackle proof-based olympiad mathematics.'),
 u('bmo2','British Mathematical Olympiad · Round 2','Advanced','Explore an advanced selection round in olympiad mathematics.'),
 u('mog','Mathematical Olympiad for Girls','Advanced','A mathematical olympiad with its own eligibility criteria.'),
 u('mcg','Mathematical Competition for Girls','Intermediate','An additional opportunity to explore mathematical competition.'),
 u('uk-team','Team Maths Challenge','Intermediate','Solve problems cooperatively as a school team.'),
 ['imo','International Mathematical Olympiad','Mathematics','Advanced','IMO','Participation is through national selection, not open individual registration.','Discover international olympiad proof problems. Official archive contains problem papers; solutions are not supplied for every paper.','https://www.imo-official.org/','https://www.imo-official.org/problems/'],
 ['usaco','USA Computing Olympiad','Computing','Advanced','USACO','Online contests have division and eligibility rules. Check the official rules for international participants.','Train with programming problems and published contest analyses.','https://usaco.org/','https://usaco.org/index.php?page=contests'],
 ...[['biology-challenge','Biology Challenge','Junior'],['intermediate-biology','Intermediate Biology Olympiad','Intermediate'],['bbo','British Biology Olympiad','Advanced']].map(([id,name,level])=>[id,name,'Science',level,'UK Biology Competitions','School entry and age rules vary by competition; check the official organiser.','Apply biological knowledge to challenging questions.','https://ukbiologycompetitions.org/','https://ukbiologycompetitions.org/'])
];
