import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './AppShell.jsx';
import './design.css';
import './neon-shell.css';
import {LanguageProvider} from './i18n.jsx';
import {AuthProvider} from './auth.jsx';
import {SchoolProvider} from './schoolContext.jsx';
import './light-palette.css';
import './appearance.css';
import './studio.css';
import './navigation.css';
import './celebration-background.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><LanguageProvider><AuthProvider><SchoolProvider><App /></SchoolProvider></AuthProvider></LanguageProvider></React.StrictMode>);
