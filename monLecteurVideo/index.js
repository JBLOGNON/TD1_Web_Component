import './lib/webaudio-control.js'

const getBaseURL = () => {
	return new URL('.', import.meta.url);
};

const AudioContext = window.AudioContext || window.webkitAudioContext;

var pannerNode;
var source;

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

  <div>
    <label for="pannerSlider">Balance</label>
    <input type="range" min="-1" max="1" step="0.1" value="0" id="pannerSlider" />
  </div>

  <div class="controls">
    <label>60Hz</label>
    <input type="range" value="0" step="1" min="-30" max="30" id="gain60"></input>
    <output id="gain0">0 dB</output>
  </div>

  <div class="controls">
    <label>170Hz</label>
    <input type="range" value="0" step="1" min="-30" max="30" id="gain170"></input>
    <output id="gain1">0 dB</output>
  </div>

  <div class="controls">
    <label>350Hz</label>
    <input type="range" value="0" step="1" min="-30" max="30" id="gain350"></input>
    <output id="gain2">0 dB</output>
  </div>

  <div class="controls">
    <label>1000Hz</label>
    <input type="range" value="0" step="1" min="-30" max="30" id="gain1000"></input>
    <output id="gain3">0 dB</output>
  </div>

  <div class="controls">
    <label>3500Hz</label>
    <input type="range" value="0" step="1" min="-30" max="30" id="gain3500"></input>
    <output id="gain4">0 dB</output>
  </div>

  <div class="controls">
    <label>10000Hz</label>
    <input type="range" value="0" step="1" min="-30" max="30" id="gain10000"></input>
    <output id="gain5">0 dB</output>
  </div>

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
     this.player.src = this.getAttribute("src");

     this.audioContext = new AudioContext();
     

     const interval = setInterval(() => {
        if (this.player) {
            this.player.onplay = (e) => { 
                this.audioContext.resume(); 
            }
            clearInterval(interval);
        }
     }, 500);

     this.buildAudioGraphPanner();

     //var sourceNode = this.audioContext.createMediaElementSource(this.player);
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
    }

    buildAudioGraphPanner() {
        // create source and gain node
        source = this.audioContext.createMediaElementSource(this.player);
        pannerNode = this.audioContext.createStereoPanner();
      
        // connect nodes together
        source.connect(pannerNode);
        pannerNode.connect(this.audioContext.destination);
    
    }

    definitEcouteurs() {
        console.log("ecouteurs définis")

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
        
        // update output labels
        var output = this.shadowRoot.querySelector("#gain"+nbFilter);
        output.value = value + " dB";
      }
  }
  
  customElements.define("my-player", MyVideoPlayer);
  