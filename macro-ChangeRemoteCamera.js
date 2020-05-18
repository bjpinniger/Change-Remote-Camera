const xapi = require('xapi');

var currentCallId = null;

//Set far end camera source
function setRemoteCamera(SourceID){
    if(currentCallId){
        xapi.command('Call FarEndControl Source Select', {  CallId: currentCallId, SourceId: SourceID}).catch((error) => { console.error(JSON.stringify(error)); });    
        xapi.command('UserInterface Message TextLine Display', {'Text': "Changed Far End Camera Source", 'x':"5000", 'y':"1000", 'Duration': "5"});
    }
    else{
        console.log('No CallId. Change Camera Source request ignored');
    }
}

function getSourceId(CameraID){
  xapi.status.get('Conference Call ', { currentCallId }).then((data) => {
    var CameraOptions = data[0].Capabilities.FECC.Source[CameraID].Options;
    var SourceID = data[0].Capabilities.FECC.Source[CameraID].SourceId;
    if (CameraOptions.includes('ptz')){
      setRemoteCamera(SourceID);
    }
    else {
      xapi.command('UserInterface Message TextLine Display', {'Text': "Invalid Camera Source", 'x':"5000", 'y':"1000", 'Duration': "5"});
    }
  });
}

xapi.event.on('CallSuccessful', (callinfo) => {
  currentCallId = callinfo.CallId;
  console.log('New CallId ' + currentCallId);
});

//send FECC
function sendCameraMove(direction){
  xapi.command('Call FarEndControl Camera Move', { CallId: currentCallId, Value: direction}).catch((error) => { console.error(JSON.stringify(error)); });    
}

function sendCameraStopControl(){
  xapi.command('Call FarEndControl Camera Stop', { CallId: currentCallId }).catch((error) => { console.error(JSON.stringify(error)); });    
}

//Recieve input from touch 10 UI widgets
xapi.event.on('UserInterface Extensions Widget Action', (event) => {
  //console.log(event);
  if(event.WidgetId == 'cameracontrol'){
      if(event.Type == 'pressed'){
          switch(event.Value){
              case 'right':
                sendCameraMove('Right');
               break;
              case 'left':
                sendCameraMove('Left');
               break;
              case 'up':
                sendCameraMove('Up');
               break;
              case 'down':
                sendCameraMove('Down');
               break;
              case 'center':
                console.log(`Center button pressed, do nothing.`);
               break;
              default:
               console.log(`Unhandled Navigation`);
          }
      }
      if(event.Type == 'released'){
        sendCameraStopControl();
      }        
  }
  else if(event.WidgetId == 'fecc_zoom'){
      if(event.Type == 'pressed'){
          switch(event.Value){
              case 'increment':
               sendCameraMove('ZoomIn');
               break;
              case 'decrement':
               sendCameraMove('ZoomOut');
               break;
          }
      }
      else if(event.Type == 'released'){
        sendCameraStopControl();
      }
  }
  else if (event.WidgetId.includes("camera_") && event.Type == 'pressed'){
      const parts = event.WidgetId.split('_');
      var CameraID = parts[1];
      getSourceId(CameraID);
    }
});

