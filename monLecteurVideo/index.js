import './lib/webaudio-control.js'

const getBaseURL = () => {
	return new URL('.', import.meta.url);
};

let style = `
<style>
    #controls {
        background-color: lightgrey;
        display: table;
    }

    #play, #avance10, #recule10 {
        background-color: transparent;
        background-repeat: no-repeat;
        border: none;
        overflow: hidden;
        outline: none;
        font-size: 30px;
        padding-top: 7px;
        padding-bottom: 7px;
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
        padding: 7.5px;
        border-left: none;
        box-shadow: inset 0 0 1px rgba(255,255,255,0.5);
        float:left;
    }

    .progress {
        width:950px;
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

    .timeBarWidth {
        width: 0;
    }

</style>`;

let template = /*html*/`
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">

  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
  
  <video id="player">
      <br>
  </video>

  <br>

  <div id="controls">
    <button id="play" class="fa fa-play"></button>
    <button id="recule10" class="fa fa-undo"></button>
    <button id="avance10" class="fa fa-repeat"></button>

    <span id="time">00:00</span>

    <div class="progress-bar">
        <div class="progress">
            <span class="timeBar"></span>
        </div>
    </div>

  </div>

  
  <button id="info">GET INFO</button>
  
  <button id="vitesse4" >Vitesse 4x</button>
  <webaudio-knob id="volume" min=0 max=1 value=0.5 step="0.01" 
         tooltip="%s" diameter="20" src="./assets/Vintage_Knob.png" sprites="100"></webaudio-knob>`;

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

     // déclarer les écouteurs sur les boutons
     this.definitEcouteurs();
    }

    definitEcouteurs() {
        console.log("ecouteurs définis")

        var isVideoPlaying = false;
        var timeDrag = false;

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

        //Progress Bar
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

        this.shadowRoot.querySelector("#vitesse4").onclick = () => {
            this.vitesse4x();
        }

        this.shadowRoot.querySelector("#info").onclick = () => {
            this.getInfo();
        }
        /*this.shadowRoot.querySelector("#volume").oninput = (event) => {
            const vol = parseFloat(event.target.value);
            this.player.volume = vol;
        }*/
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

        //let barLength = timerWrapper.clientWidth * (media.currentTime/media.duration);
        //timerBar.style.width = barLength + 'px';
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

        var sheet = new CSSStyleSheet;
        sheet.replaceSync( `.timeBarWidth { width: ` + percentage + `%;}`);
        this.shadowRoot.adoptedStyleSheets = [ sheet ];

		//this.shadowRoot.querySelector('.timeBar').css('width',percentage+'%'); 	
		this.player.currentTime = maxduration * percentage / 100;
	}

    vitesse4x() {
        this.player.playbackRate = 4;
    }

    getInfo() {
        console.log("Durée de la vidéo : " + this.player.duration);
        console.log("Temps courant : " + this.player.currentTime);
    }
  }
  
  customElements.define("my-player", MyVideoPlayer);
  