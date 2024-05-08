/**
 *
 *
 * Author: Gery Casiez
 *
 */

import { TurboTouchPredictor } from 'turbotouchpredictor'
import { OneEuroFilter } from '1eurofilter'
import { ConstantSpeedPredictor } from './ConstantSpeedPredictor.js'

document.addEventListener("DOMContentLoaded", function() {
   var points = [];
   var state = "UP";

   // get canvas element and create context
   var canvas  = document.getElementById('canvas');
   var context = canvas.getContext('2d');
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

   /*var clearbutton = document.getElementById('clearbutton');
   clearbutton.onclick = function(e) {
      clearScreen();  
   }*/

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
   var timescale = 1E6; 

   // register mouse event handlers
   canvas.onmousedown = function(e){
      state = "DOWN";
      points.push({x: e.offsetX, y: e.offsetY, t: e.timeStamp * timescale});
      predictedPoint = predictor.predict({x: e.offsetX, y: e.offsetY, t: e.timeStamp * timescale, state: "Interacting"});
   };
   
   canvas.onmouseup = function(e){
      state = "UP";
      clearScreen();
      predictedPoint = predictor.predict({x: e.offsetX, y: e.offsetY, t: e.timeStamp * timescale, state: "NotInteracting"});
      predictor.reset();
      points = [];
      redraw();
   };

   canvas.onmousemove = function(e) {
      if (state == "DOWN") {
         points.push({x: e.offsetX, y: e.offsetY, t: e.timeStamp * timescale});
         var t1 = new Date().getTime();
         predictedPoint = predictor.predict({x: e.offsetX, y: e.offsetY, t: e.timeStamp * timescale, state: "Interacting"});
         var t2 = new Date().getTime();
         predictionTime = t2 - t1;
         redraw();
      }
   };

   function redraw () {
      var ts = new Date().getTime();
      if (ts != last_ts) {
         fps = 1000/(ts-last_ts);
         fpsfilt = filterfps.filter(fps);
      }
      
      last_ts = ts;

      clearScreen();
      if (state == "UP") {
        var txt = "Touch the screen or click and drag to interact";
        context.font = "30px Georgia";

        context.fillText(txt,width/2-context.measureText(txt).width/2,height/2);
      } else {
        context.beginPath();
        context.lineWidth="2";
        context.strokeStyle="black";
        var i;
        for (i = 1; i < points.length; i++) {
           context.moveTo(points[i-1].x, points[i-1].y);
           context.lineTo(points[i].x, points[i].y);
        }
        context.stroke();
        context.beginPath();
        context.lineWidth="5";
        context.strokeStyle="red";
        context.moveTo(points[points.length-1].x, points[points.length-1].y);
        context.lineTo(predictedPoint.x, predictedPoint.y);
        context.stroke();
      }
      var txt = fpsfilt.toFixed(0) + " fps - prediction computation time: " + predictionTime + " ms";
      context.font = "14px Georgia";
      context.fillText(txt,15,15);
   }

   function clearScreen() {
      context.clearRect(0, 0, canvas.width, canvas.height);
   }
   
   redraw();

});