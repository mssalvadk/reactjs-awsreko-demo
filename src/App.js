import React, { Component } from 'react';
import MyDropzone from './components/MyDropzone.jsx';

import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">

        <hr />

        <h2><b>Wanna gauge your likeness with someone?</b></h2>
        <h3>Upload a photo here and the person you wanna checkout!</h3>
        <h4>No worries, you can load photos with multiple faces.</h4>

        <hr />

        <div className="row">
          <div className="col">
            <MyDropzone />  
          </div>
        </div>

        <hr />
        
        <p style={{fontSize:10 + 'px'}}><em>Disclaimer: This demo is for fun only. No images are stored. Amazon Rekognition face comparison is a stateless API operation. That is, data returned by this operation doesn't persist.  </em></p>
        <hr />
      </div>
    );
  }
}

export default App;
