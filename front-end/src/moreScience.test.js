import test from 'node:test';
import assert from 'node:assert/strict';
import {buoyancy,refract,gasPressure,photosynthesisRate,enzymeRate,reactionProduct,diffusionMix} from './moreScience.js';

test('Floating displaces the weight of the object, with neutral and sinking boundaries',()=>{
 const b=buoyancy(300,500,1);assert.equal(b.floats,true);assert.equal(b.fraction,0.6);assert.equal(b.fraction*500*1,300);
 assert.equal(buoyancy(500,500,1).neutral,true);assert.equal(buoyancy(600,500,1).floats,false);
});
test('Snell law preserves straight incidence, bends toward the normal and detects total internal reflection',()=>{
 assert.equal(refract(0,1,1.5).angle,0);const r=refract(30,1,1.5);assert.ok(r.angle<30);
 assert.ok(Math.abs(1.5*Math.sin(r.angle*Math.PI/180)-0.5)<1e-12);
 assert.equal(refract(45,1.5,1).totalInternalReflection,true);assert.equal(refract(30,1.5,1).totalInternalReflection,false);
});
test('Isothermal compression conserves pressure times volume',()=>{
 for(const v of [100,150,300,600])assert.equal(gasPressure(v)*v,30000);
 assert.equal(gasPressure(150),2*gasPressure(300));
});
test('Photosynthesis teaching model respects darkness and the limiting factor',()=>{
 assert.equal(photosynthesisRate(0,.1,25),0);assert.equal(photosynthesisRate(100,.03,25),photosynthesisRate(300,.03,25));
 assert.ok(photosynthesisRate(300,.06,25)>photosynthesisRate(300,.03,25));
});
test('Enzyme model loses activity away from its stated optimum and after denaturation',()=>{
 assert.equal(enzymeRate(37,7),100);assert.ok(enzymeRate(37,3)<enzymeRate(37,7));assert.ok(enzymeRate(10,7)<enzymeRate(37,7));assert.equal(enzymeRate(70,7),0);
});
test('Reaction and diffusion models start unmixed and remain bounded as temperature or time increases',()=>{
 assert.equal(reactionProduct(0,1,20,1),0);assert.equal(diffusionMix(0,20),0);
 assert.ok(reactionProduct(30,1,30,1)>reactionProduct(30,1,20,1));assert.ok(diffusionMix(30,80)>diffusionMix(30,20));
 for(const t of [1,20,120,10000]){assert.ok(reactionProduct(t,3,50,5)<=100);assert.ok(diffusionMix(t,80)<=1);}
});
