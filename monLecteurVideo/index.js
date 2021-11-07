import './lib/webaudio-control.js'

const getBaseURL = () => {
	return new URL('.', import.meta.url);
};

const AudioContext = window.AudioContext || window.webkitAudioContext;

var pannerNode;
var source;
var width, height;

let style = `
<style>
    #controls {
        background-color: lightgrey;
        display: table;
        width: 1280px;
    }

    #play, #avance10, #recule10, #speed, #info {
        background-color: transparent;
        background-repeat: no-repeat;
        border: none;
        overflow: hidden;
        outline: none;
        font-size: 30px;
        padding-top: 7px;
        padding-bottom: 7px;
    }

    #info {
        margin-left: 15px;
    }

    #time{
        padding-left: 15px;
        padding-right: 15px;
        font-size: 20px;
        font-weight: bold;
        display: table-cell;
        vertical-align: middle;
    }

    .progress-bar {
        padding: 20px;
        border-left: none;
        box-shadow: inset 0 0 1px rgba(255,255,255,0.5);
        float:left;
    }

    .progress {
        width:920px;
        height:7px;
        position:relative;
        cursor:pointer;
        background: rgba(0,0,0,0.4); /* fallback */
        box-shadow: 0 1px 0 rgba(255,255,255,0.1), inset 0 1px 1px rgba(0,0,0,1);
        border-radius:10px;
    }

    .progress span {
        height:100%;
        position:absolute;
        top:0;
        left:0;
        display:block;
        border-radius:10px;
    }

    .timeBar{
        z-index:10;
        
        background: -webkit-linear-gradient(top, rgba(107,204,226,1) 0%,rgba(29,163,208,1) 100%);
        box-shadow: 0 0 7px rgba(107,204,226,.5);
    }

    .hover_bkgr_fricc{
        background:rgba(0,0,0,.4);
        cursor:pointer;
        display:none;
        height:100%;
        position:fixed;
        text-align:center;
        top:0;
        width:100%;
        z-index:10000;
    }
    .hover_bkgr_fricc .helper{
        display:inline-block;
        height:100%;
        vertical-align:middle;
    }
    .hover_bkgr_fricc > div {
        background-color: #fff;
        box-shadow: 10px 10px 60px #555;
        display: inline-block;
        height: auto;
        max-width: 551px;
        min-height: 100px;
        vertical-align: middle;
        width: 60%;
        position: relative;
        border-radius: 8px;
        padding: 15px 5%;
    }
    .popupCloseButton {
        background-color: #fff;
        border: 3px solid #999;
        border-radius: 50px;
        cursor: pointer;
        display: inline-block;
        font-family: arial;
        font-weight: bold;
        position: absolute;
        top: -20px;
        right: -20px;
        font-size: 25px;
        line-height: 30px;
        width: 30px;
        height: 30px;
        text-align: center;
    }
    .popupCloseButton:hover {
        background-color: #ccc;
    }

    #audio-buttons {
        background-color: lightgrey;
        width: 1274px;
        padding-bottom: 15px;
        border: 3px solid grey;
        display: flex;
        justify-content: center;
    }

    #audio-buttons webaudio-knob {
        margin: 0 auto;
    }

</style>`;

let template = /*html*/`
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  
  <video id="player" crossorigin="anonymous">
      <br>
  </video>

  <br>

  <div id="controls">
    <button id="play" class="fa fa-play"></button>
    <button id="recule10" class="fa fa-undo"></button>
    <button id="avance10" class="fa fa-repeat"></button>

    <webaudio-knob id="volume" min=0 max=1 value=0.5 step="0.01" 
            tooltip="%s" diameter="30" src="./assets/Vintage_Knob.png" sprites="100"></webaudio-knob>

    <span id="time">00:00</span>

    <div class="progress-bar">
        <div class="progress">
            <span class="timeBar"></span>
        </div>
    </div>

    <button id="speed" class="fa fa-step-forward"></button>
    <button id="info" class="fa fa-info-circle"></button>
  </div>

  <div id="audio-buttons">
    <webaudio-knob id="pannerSlider" min=-1 max=1 value=0 step="0.1" 
            tooltip="%s" diameter="50" src="./assets/Carbon.png" sprites="100">Balance</webaudio-knob>
    <webaudio-knob id="gain60" min=-30 max=30 value=0 step="1" 
            tooltip="%s" diameter="50" src="./assets/Carbon.png" sprites="100">60Hz</webaudio-knob>
    <webaudio-knob id="gain170" min=-30 max=30 value=0 step="1" 
            tooltip="%s" diameter="50" src="./assets/Carbon.png" sprites="100">170Hz</webaudio-knob>
    <webaudio-knob id="gain350" min=-30 max=30 value=0 step="1" 
            tooltip="%s" diameter="50" src="./assets/Carbon.png" sprites="100">350Hz</webaudio-knob>
    <webaudio-knob id="gain1000" min=-30 max=30 value=0 step="1" 
            tooltip="%s" diameter="50" src="./assets/Carbon.png" sprites="100">1000Hz</webaudio-knob>
    <webaudio-knob id="gain3500" min=-30 max=30 value=0 step="1" 
            tooltip="%s" diameter="50" src="./assets/Carbon.png" sprites="100">3500Hz</webaudio-knob>
    <webaudio-knob id="gain10000" min=-30 max=30 value=0 step="1" 
            tooltip="%s" diameter="50" src="./assets/Carbon.png" sprites="100">10000Hz</webaudio-knob>
  </div>

  <canvas id="myCanvas" width=300 height=100></canvas>

  <div class="hover_bkgr_fricc">
    <span class="helper"></span>
    <div>
        <div class="popupCloseButton">&times;</div>
        <p id="description">Add any HTML content<br />inside the popup box!</p>
    </div>
  </div>`;

class MyVideoPlayer extends HTMLElement {
    constructor() {
      super();
      //this.attachShadow({ mode: "open" });
      this.root = this.attachShadow({mode: "open"});

    }

    fixeRelativeURL(){
        let knobs = this.shadowRoot.querySelectorAll('webaudio-knob');
        knobs.forEach((e) => {
            let path = e.getAttribute('src');
            e.src = getBaseURL() + '/' + path;
        });
    }
  
    connectedCallback() {
     // Appelée avant affichage du composant
     //this.shadowRoot.appendChild(template.content.cloneNode(true));
     this.root.innerHTML = template + style;

     this.fixeRelativeURL();

     this.player = this.shadowRoot.querySelector("#player");
     this.canvas = this.shadowRoot.querySelector("#myCanvas");

     this.player.src = this.getAttribute("src");

     width = this.canvas.width;
     height = this.canvas.height;

     this.audioContext = new AudioContext();
     this.canvasContext = this.canvas.getContext('2d');
     
     const interval = setInterval(() => {
        if (this.player) {
            this.player.onplay = (e) => { 
                this.audioContext.resume(); 
            }
            clearInterval(interval);
        }
     }, 500);

     this.buildAudioGraphPanner();

     this.filters = [];
     [60, 170, 350, 1000, 3500, 10000].forEach((freq, i) => {
        var eq = this.audioContext.createBiquadFilter();
        eq.frequency.value = freq;
        eq.type = "peaking";
        eq.gain.value = 0;
        this.filters.push(eq);
      });

     source.connect(this.filters[0]);
     for(var i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].connect(this.filters[i+1]);
     }

     this.filters[this.filters.length - 1].connect(this.audioContext.destination);

     this.shadowRoot.querySelector('.timeBar').style.width = "0";

     // déclarer les écouteurs sur les boutons
     this.definitEcouteurs();

     //requestAnimationFrame(() => this.visualize2());
    }

    buildAudioGraphPanner() {
        // create source and gain node
        source = this.audioContext.createMediaElementSource(this.player);
        pannerNode = this.audioContext.createStereoPanner();

        // Create an analyser node
        this.analyser = this.audioContext.createAnalyser();
        
        // Try changing for lower values: 512, 256, 128, 64...
        this.analyser.fftSize = 512;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
      
        // connect nodes together
        source.connect(pannerNode);
        pannerNode.connect(this.audioContext.destination);
    
    }

    definitEcouteurs() {
        var isVideoPlaying = false;
        var timeDrag = false;
        var videoSpeed = 1;

        this.shadowRoot.querySelector("#play").onclick = () => {
            if (isVideoPlaying == false) {
                this.play();
                this.shadowRoot.querySelector("#play").classList.remove('fa-play');
                this.shadowRoot.querySelector("#play").classList.add('fa-pause');
                isVideoPlaying = true;
            } else {
                this.pause();
                this.shadowRoot.querySelector("#play").classList.remove('fa-pause');
                this.shadowRoot.querySelector("#play").classList.add('fa-play');
                isVideoPlaying = false;
            }
        }

        this.shadowRoot.querySelector("#avance10").onclick = () => {
            this.avance10s();
        }

        this.shadowRoot.querySelector("#recule10").onclick = () => {
            this.recule10s();
        }

        this.shadowRoot.querySelector("#player").ontimeupdate  = () => {
            this.updateTime();
        }

        this.shadowRoot.querySelector('.progress').onmousedown = (e) => {
            timeDrag = true;
            this.updatebar(e.pageX);
        }

        this.shadowRoot.querySelector('.progress').onmouseup = (e) => {
            if(timeDrag) {
                timeDrag = false;
                this.updatebar(e.pageX);
            }
        }

        this.shadowRoot.querySelector('.progress').onmousemove = (e) => {
            if(timeDrag) {
                this.updatebar(e.pageX);
            }
        }

        this.shadowRoot.querySelector("#speed").onclick = () => {
            if (videoSpeed == 1) {
                this.speed(2);
                this.shadowRoot.querySelector("#speed").classList.remove('fa-step-forward');
                this.shadowRoot.querySelector("#speed").classList.add('fa-forward');
                videoSpeed = 2;
            } else if (videoSpeed == 2) {
                this.speed(4);
                this.shadowRoot.querySelector("#speed").classList.remove('fa-forward');
                this.shadowRoot.querySelector("#speed").classList.add('fa-fast-forward');
                videoSpeed = 3;                
            } else {
                this.speed(1);
                this.shadowRoot.querySelector("#speed").classList.remove('fa-fast-forward');
                this.shadowRoot.querySelector("#speed").classList.add('fa-step-forward');
                videoSpeed = 1;
            }
        }

        this.shadowRoot.querySelector("#info").onclick = () => {
            this.getInfo();
        }

        this.shadowRoot.querySelector('#pannerSlider').oninput = (event) => {
            pannerNode.pan.value = event.target.value;
        }

        this.shadowRoot.querySelector('.popupCloseButton').onclick = () => {
            this.shadowRoot.querySelector('.hover_bkgr_fricc').style.display = 'none';
        }
        this.shadowRoot.querySelector("#volume").oninput = (event) => {
            const vol = parseFloat(event.target.value);
            this.volume(vol);
        }

        this.shadowRoot.querySelector('#gain60').oninput = (event) => {
            this.changeGain(event.target.value, 0);
        }

        this.shadowRoot.querySelector('#gain170').oninput = (event) => {
            this.changeGain(event.target.value, 1);
        }

        this.shadowRoot.querySelector('#gain350').oninput = (event) => {
            this.changeGain(event.target.value, 2);
        }

        this.shadowRoot.querySelector('#gain1000').oninput = (event) => {
            this.changeGain(event.target.value, 3);
        }

        this.shadowRoot.querySelector('#gain3500').oninput = (event) => {
            this.changeGain(event.target.value, 4);
        }

        this.shadowRoot.querySelector('#gain10000').oninput = (event) => {
            this.changeGain(event.target.value, 5);
        }

        window.onkeyup = (e) => {
            if (e.keyCode == 32) {
                this.play();
            }
            if (e.keyCode == 77) {
                this.volume(0);
            }
            if (e.keyCode == 39) {
                this.avance10s();
            }
            if (e.keyCode == 37) {
                this.recule10s();
            }
        }
    }
  
    // API de mon composant
    play() {
        this.player.play();
    }

    pause() {
        this.player.pause();
    }

    avance10s() {
        this.player.currentTime += 10;
    }

    recule10s() {
        if (this.player.currentTime <= 10) {
            this.player.currentTime = 0;
        } else {
           this.player.currentTime -= 10; 
        }
        
    }

    updateTime(){
        let minutes = Math.floor(this.player.currentTime / 60);
        let seconds = Math.floor(this.player.currentTime - minutes * 60);
        let minuteValue;
        let secondValue;

        if (minutes < 10) {
            minuteValue = '0' + minutes;
        } else {
            minuteValue = minutes;
        }

        if (seconds < 10) {
            secondValue = '0' + seconds;
        } else {
            secondValue = seconds;
        }

        let mediaTime = minuteValue + ':' + secondValue;
        this.shadowRoot.querySelector("#time").textContent = mediaTime;

        var progressBarLenght = this.shadowRoot.querySelector('.progress').offsetWidth;
        this.shadowRoot.querySelector('.timeBar').style.width = ( (this.player.currentTime * progressBarLenght) / this.player.duration) + 'px'; 
    }

    updatebar(x) {
		var progress= this.shadowRoot.querySelector('.progress');
		var maxduration = this.player.duration;
		var position = x - progress.getBoundingClientRect().x;
		var percentage = 100 * position / progress.getBoundingClientRect().width;
		if(percentage > 100) {
			percentage = 100;
		}
		if(percentage < 0) {
			percentage = 0;
		}

		this.shadowRoot.querySelector('.timeBar').style.width = percentage + '%'; 	
		this.player.currentTime = maxduration * percentage / 100;
	}

    speed(newSpeed) {
        this.player.playbackRate = newSpeed;
    }

    getInfo() {
        console.log("Durée de la vidéo : " + this.player.duration);
        console.log("Temps courant : " + this.player.currentTime);
        this.shadowRoot.querySelector("#description").innerHTML = "Durée de la vidéo : " + this.player.duration + ", " + 
        "Temps courant : " + this.player.currentTime;
        this.shadowRoot.querySelector('.hover_bkgr_fricc').style.display = 'block';
    }

    volume(vol) {
        this.player.volume = vol;
    }

    changeGain(sliderVal,nbFilter) {
        var value = parseFloat(sliderVal);
        this.filters[nbFilter].gain.value = value;
    }

    visualize2() {
        this.canvasContext = this.canvas.getContext('2d');
        this.canvasContext.save();
        this.canvasContext.fillStyle = "rgba(0, 0, 0, 0.05)";
        this.canvasContext.fillRect (0, 0, width, height);
    
        this.analyser.getByteFrequencyData(this.dataArray);
        var nbFreq = this.dataArray.length;
        
        var SPACER_WIDTH = 5;
        var BAR_WIDTH = 2;
        var OFFSET = 100;
        var CUTOFF = 23;
        var HALF_HEIGHT = height;
        var numBars = 1.7*Math.round(width / SPACER_WIDTH);
        var magnitude;
      
        this.canvasContext.lineCap = 'round';
    
        for (var i = 0; i < numBars; ++i) {
           magnitude = 0.3*this.dataArray[Math.round((i * nbFreq) / numBars)];
           this.canvasContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
           this.canvasContext.fillRect(i * SPACER_WIDTH, HALF_HEIGHT, BAR_WIDTH, -magnitude);
        }
        
        this.canvasContext.stroke();
        
        this.canvasContext.restore();
      
        requestAnimationFrame(() => this.visualize2());
    }
  }

  
  customElements.define("my-player", MyVideoPlayer);
  