import test from 'node:test';
import assert from 'node:assert/strict';
import {scienceResourceBranch} from './scienceResources.js';
test('Teacher science units determine the branch even for generic PowerPoint names',()=>{
 assert.equal(scienceResourceBranch({title:'PowerPoint 10.1',unit:'10 - (C) - Structure, bonding, and properties'}),'Chemistry');
 assert.equal(scienceResourceBranch({title:'What is diffusion?',unit:'6 - (P) - Forces'}),'Physics');
 assert.equal(scienceResourceBranch({title:'PowerPoint 9.2',unit:'9 - (B) - Plant biology'}),'Biology');
});
test('Clearly titled science files are classified while shared and ambiguous materials stay general',()=>{
 assert.equal(scienceResourceBranch({title:'Biology Chapter 2 PowerPoint',unit:'G7 Science'}),'Biology');
 assert.equal(scienceResourceBranch({title:'Plant Nutrients PPT'}),'Biology');
 assert.equal(scienceResourceBranch({title:'Grade 8 Course Companion'}),'General Science');
 assert.equal(scienceResourceBranch({title:'Physics and Chemistry overview'}),'General Science');
});
