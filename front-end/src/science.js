export function neutralization(acidMl,baseMl,acidM=0.1,baseM=0.1){
  if([acidMl,baseMl,acidM,baseM].some(n=>!Number.isFinite(n)||n<=0))return null;
  const acid=acidMl*acidM/1000,base=baseMl*baseM/1000,volume=(acidMl+baseMl)/1000,excess=(acid-base)/volume,root=Math.sqrt(excess*excess+4e-14);
  const hydrogen=excess>=0?(excess+root)/2:2e-14/(root-excess);
  const reacted=Math.min(acid,base),ph=-Math.log10(hydrogen);
  return{ph,reacted,saltM:reacted/volume,heat:reacted*57300,temperatureRise:reacted*57300/((acidMl+baseMl)*4.184),state:Math.abs(acid-base)<1e-12?'neutral':acid>base?'acidic':'alkaline'};
}
export function circuitValues(voltage,resistance,closed=true){if(!Number.isFinite(voltage)||!Number.isFinite(resistance)||resistance<=0)return{current:0,power:0};return{current:closed?voltage/resistance:0,power:closed?voltage*voltage/resistance:0};}
export function pendulumPeriod(length,gravity){return length>0&&gravity>0?2*Math.PI*Math.sqrt(length/gravity):0;}
