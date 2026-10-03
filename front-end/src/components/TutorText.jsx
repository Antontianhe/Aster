import React from 'react';
import s from './TutorText.module.css';

// Render common tutor emphasis and simple equation notation as React text nodes.
// Model output never becomes HTML or an executable link.
function equation(value){return value.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,'($1) / ($2)').replace(/\\sqrt\{([^{}]+)\}/g,'√($1)').replace(/\\(?:times|cdot)\b/g,'×').replace(/\\div\b/g,'÷').replace(/\\pi\b/g,'π').replace(/\\leq?\b/g,'≤').replace(/\\geq?\b/g,'≥').replace(/\\neq\b/g,'≠').replace(/\\(?:left|right)\b/g,'').replace(/\^(?:\{2\}|2(?!\d))/g,'²').replace(/\^(?:\{3\}|3(?!\d))/g,'³');}
export default function TutorText({text=''}){
 const pieces=String(text).split(/(\*\*[^*]+\*\*|\$\$[\s\S]+?\$\$|\$[^$\n]+\$|`[^`]+`)/g);
 return <div className={s.reply}>{pieces.map((part,i)=>part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part.startsWith('$$')?<span className={s.equationBlock} key={i}>{equation(part.slice(2,-2).trim())}</span>:part.startsWith('$')?<span className={s.equation} key={i}>{equation(part.slice(1,-1))}</span>:part.startsWith('`')?<code key={i}>{part.slice(1,-1)}</code>:<React.Fragment key={i}>{part}</React.Fragment>)}</div>;
}
