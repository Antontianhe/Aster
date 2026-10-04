import React from 'react';
import {useApp} from '../../context.jsx';
import {dayKey} from '../../study.js';
import {sceneFor} from '../../celebrations.js';
import {WorldScenery} from './StudyWorld.jsx';
import world from './StudyWorld.module.css';
import s from './CelebrationBackground.module.css';

export default function CelebrationBackground(){
  const {prefs,now}=useApp();
  const {scene}=sceneFor(dayKey(new Date(now)),prefs);
  return <div className={`${world.world} ${s.background}`} data-scene={scene} aria-hidden="true"><WorldScenery scene={scene} ambient/></div>;
}
