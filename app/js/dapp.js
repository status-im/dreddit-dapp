import App from './components/App';
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import {render} from 'react-dom';

window.EmbarkJS = EmbarkJS;

render(<App />, document.getElementById('root'));
