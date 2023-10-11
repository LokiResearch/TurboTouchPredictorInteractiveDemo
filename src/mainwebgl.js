/**
 *
 *
 * Author: Gery Casiez
 *
 */

import { TurboTouchPredictor } from 'TurboTouchPredictor'
import { OneEuroFilter } from '1eurofilter'
import { ConstantSpeedPredictor } from './ConstantSpeedPredictor.js'
import * as THREE from 'three';

document.addEventListener("DOMContentLoaded", function() {
   var points = [];
   var state = "UP";

   // get canvas element and create context
   var canvas  = document.getElementById('WebGL-output');
   var width   = window.innerWidth;
   var height  = window.innerHeight;

   // set canvas to full browser width/height
   canvas.width = width;
   canvas.height = height;

   // Set up touch events for mobile, etc
   canvas.addEventListener("touchstart", function (e) {
     //mousePos = getTouchPos(canvas, e);
     var touch = e.touches[0];
     var mouseEvent = new MouseEvent("mousedown", {
       clientX: touch.clientX,
       clientY: touch.clientY
     });
     canvas.dispatchEvent(mouseEvent);
   }, false);
   canvas.addEventListener("touchend", function (e) {
     var mouseEvent = new MouseEvent("mouseup", {});
     canvas.dispatchEvent(mouseEvent);
   }, false);
   canvas.addEventListener("touchmove", function (e) {
     var touch = e.touches[0];
     var mouseEvent = new MouseEvent("mousemove", {
       clientX: touch.clientX,
       clientY: touch.clientY
     });
     canvas.dispatchEvent(mouseEvent);
   }, false);

   // compute refresh rate
   var last_ts = new Date().getTime();
   var filterfps = new OneEuroFilter(60, 1, 0);
   var predictionTime = 0;
   var fpsfilt = 0;
   var fps = 0;

   // Get the position of a touch relative to the canvas
   function getTouchPos(canvasDom, touchEvent) {
     var rect = canvasDom.getBoundingClientRect();
     return {
       x: touchEvent.touches[0].clientX - rect.left,
       y: touchEvent.touches[0].clientY - rect.top
     };
   }

   window.onresize = function(e){
      width   = window.innerWidth;
      height  = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
   };

   var linearPredictor = new ConstantSpeedPredictor();

   var ttpPredictor = new TurboTouchPredictor();
   var predictor = document.getElementById('ttp').checked ? ttpPredictor : linearPredictor;

   var latcompRadios  = document.getElementsByName('latcomp');
   for (var i = 0; i < latcompRadios.length; i++) {
      latcompRadios[i].onchange = function (e) {
        predictor.setAmountOfCompensation(parseInt(e.target.value));
      }
      if (latcompRadios[i].checked) predictor.setAmountOfCompensation(parseInt(latcompRadios[i].value));
   }

   var predictorRadios  = document.getElementsByName('predictors');
   for (var i = 0; i < predictorRadios.length; i++) {
      predictorRadios[i].onchange = function (e) {
         if (e.target.value == "TTP") predictor = ttpPredictor;
         if (e.target.value == "linear") predictor = linearPredictor;
         for (var i = 0; i < latcompRadios.length; i++) {
            if (latcompRadios[i].checked) predictor.setAmountOfCompensation(parseInt(latcompRadios[i].value));
         }
      }
   }

   var instBut  = document.getElementById('instBut');
   instBut.onclick = function(e) {
      var x = document.getElementById("instructions");
      if (x.style.display === "none") {
          x.style.display = "block";
          instBut.textContent = "Hide instructions";
      } else {
          x.style.display = "none";
          instBut.textContent = "Show instructions";
      }
   }

   var predictedPoint;

   var scene;
   var renderer;
   var camera;

   init();

  function init() {

    camera = new THREE.OrthographicCamera( 0, width, 0, height, -1, 1000 );
    camera.position.set(0 , 0 , 0);

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById("WebGL-output").appendChild(renderer.domElement);
    renderer.render(scene, camera);
  }


   // register mouse event handlers
   canvas.onmousedown = function(e){
      state = "DOWN";
      points.push({x: e.offsetX, y: e.offsetY, t: e.timeStamp * 1E6});
      predictedPoint = predictor.predict({x: e.offsetX, y: e.offsetY, t: e.timeStamp * 1E6, state: "Interacting"});
   };
   
   canvas.onmouseup = function(e){
      state = "UP";
      //clearScreen();
      predictedPoint = predictor.predict({x: e.offsetX, y: e.offsetY, t: e.timeStamp * 1E6, state: "NotInteracting"});
      predictor.reset();
      points = [];
      requestAnimationFrame(redraw);
   };

   canvas.onmousemove = function(e) {
      if (state == "DOWN") {
         points.push({x: e.offsetX, y: e.offsetY, t: e.timeStamp * 1E6});
         var t1 = new Date().getTime();
         predictedPoint = predictor.predict({x: e.offsetX, y: e.offsetY, t: e.timeStamp * 1E6, state: "Interacting"});
         var t2 = new Date().getTime();
         predictionTime = t2 - t1;
         requestAnimationFrame(redraw);
      }
   };

   function redraw () {
      var ts = new Date().getTime();
      if (ts != last_ts) {
         fps = 1000/(ts-last_ts);
         fpsfilt = filterfps.filter(fps);
      }

      last_ts = ts;

      while(scene.children.length > 0){ 
         scene.remove(scene.children[0]); 
      }

      if (state == "UP") {

      } else {
         var material = new THREE.LineBasicMaterial( { color: 0x000000 } );
         var geometry = new THREE.BufferGeometry();
         var i;
         var vertices = [];
         for (i = 1; i < points.length; i++) {    
            vertices.push(points[i-1].x, points[i-1].y, 0);
            vertices.push(points[i].x, points[i].y, 0);
         }

         geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ) );
         var line = new THREE.Line( geometry, material );
         scene.add( line );

         vertices = [];
         material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
         geometry = new THREE.BufferGeometry();
         vertices.push(points[points.length-1].x, points[points.length-1].y, 0);
         vertices.push(predictedPoint.x, predictedPoint.y, 0);
         geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ) );
         line = new THREE.Line( geometry, material );
         scene.add( line );
      }

      renderer.render(scene, camera);
      var txt = fps.toFixed(0) + " fps - prediction computation time: " + predictionTime + " ms";
      document.getElementById('info').textContent = txt;

   }

});