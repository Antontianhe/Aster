export const SCIENCE_BRANCHES=['Chemistry','Physics','Biology'];
export function scienceResourceBranch(resource){
 if(SCIENCE_BRANCHES.includes(resource.branch))return resource.branch;
 const unit=String(resource.unit||'');
 if(/\(B\)|\bbiology\b/i.test(unit))return 'Biology';
 if(/\(C\)|\bchemistry\b/i.test(unit))return 'Chemistry';
 if(/\(P\)|\bphysics\b/i.test(unit))return 'Physics';
 const title=String(resource.title||'');
 const matches=[
  ['Biology',/\b(biology|photosynthesis|plant|plants|kidney|kidneys|genetics|enzymes?|respiration|inheritance|excretion)\b/i],
  ['Chemistry',/\b(chemistry|chemical reactions?|periodic table|bonding|neutralisation|neutralization|acids?|alkalis?)\b/i],
  ['Physics',/\b(physics|forces?|electricity|circuits?|magnetism|refraction|reflection|pendulum|voltage|wavelength)\b/i],
 ].filter(([,pattern])=>pattern.test(title));
 return matches.length===1?matches[0][0]:'General Science';
}
