import './lib/webaudio-control.js'

const getBaseURL = () => {
	return new URL('.', import.meta.url);
};

let style = `
<style>
    #play {
        background: none;
        width: 50px;
        height: 50px;
        border: solid 5px #000000;
        border-radius: 100%;
        position: relative; 
        text-indent:-9999px;
        box-shadow: 1px 1px 3px #999999;
    }

    #play span {
        width: 0;
        height: 0;
        border-top: 15px solid transparent;
        border-left: 20px solid #000000;
        border-bottom: 15px solid transparent;
        position:absolute;
        top:20%;
        left:36%;    
    }

    #play:hover{
        background:#4ccaea;
        cursor:pointer;
        opacity:0.8;
        border:none;
        width: 60px;
        height: 60px; 
        box-shadow:none;
    }

    #play:hover span{
        top:25%;
        left:38%;
    }
</style>`;

let template = /*html*/`
  <video id="player" controls>
      <br>
  </video>

  <br>

  <div>
    <div id="play">
        <span>Play</span>
    </div>
    <p id="timer"></p>
  </div>
  
  <button id="pause">PAUSE</button>
  <button id="info">GET INFO</button>
  <button id="avance10">+10s</button>
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

     var timer = this.shadowRoot.querySelector("#timer");
     /*var update = setInterval(function () {
         timer.innerText = this.player.currentTime + " : " + this.player.duration;}, 500);*/
    }

    definitEcouteurs() {
        console.log("ecouteurs définis")
        this.shadowRoot.querySelector("#play").onclick = () => {
            this.play();
        }
        this.shadowRoot.querySelector("#pause").onclick = () => {
            this.pause();
        }
        this.shadowRoot.querySelector("#avance10").onclick = () => {
            this.avance10s();
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

    vitesse4x() {
        this.player.playbackRate = 4;
    }

    getInfo() {
        console.log("Durée de la vidéo : " + this.player.duration);
        console.log("Temps courant : " + this.player.currentTime);
    }
  }
  
  customElements.define("my-player", MyVideoPlayer);
  