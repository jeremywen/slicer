var shell = require("shelljs");
var shuffle = require("shuffle");
var tempFilePrefix = "___temp___";
var playCommand = "open" //using default player because the sox play command sounds like crap
var sliceLength = 0.15; //format: 00:00.00
var centRange = 2400;
var maxDelayMs = 100;
var repeatFinalAudioTimes = 1;
var combineList = ["concatenate"]; //sequence, concatenate, mix, mix-power, merge, multiply
var outputRateString = "rate 44100";
var verbose = false;
var percentAltered = 0.20;

/******************************************************************************** 
 * Split up the audio file passed in
 ********************************************************************************/
shell.rm(tempFilePrefix + "*.wav");
if(process.argv.length > 2){
  var fileArg = process.argv[2];
  for(var i=0;i<4;i++){
    exec("sox "+(verbose?"--show-progress":"")+" '" + fileArg + "' " + tempFilePrefix + i + ".wav trim 0 " + (sliceLength*(i+1)) + " : newfile : restart");
  }
  sliceLength = 0.750
}
var inputFiles = shell.ls(tempFilePrefix+"*.wav");
if(verbose){ console.log("inputFiles = "+inputFiles); }


/******************************************************************************** 
 * Alter some of the temp files
 ********************************************************************************/
var alterCommands = [];
alterSlices(function(){ return "reverb"; }, percentAltered);
alterSlices(function(){ return "echos 0.5 0.5 " + [rnd()*maxDelayMs, rnd(), rnd()*maxDelayMs, rnd(), rnd()*500, rnd()].join(" "); }, percentAltered);
alterSlices(function(){ return "tempo " + (0.25 + rnd()*10); }, percentAltered);
alterSlices(function(){ return "speed " + (0.25 + rnd()*10); }, percentAltered);
alterSlices(function(){ return "pitch " + Math.floor((rnd()*centRange*1)-centRange); }, percentAltered);
alterSlices(function(){ return "repeat " + Math.floor(rnd()*4+1);}, percentAltered-0.10);
alterSlices(function(){ return "delay " + (rnd()*1);}, percentAltered-0.15);
alterSlices(function(){ return "reverse"; }, percentAltered);
if(alterCommands.length > 0) { exec(alterCommands.join(" && ")); }


/******************************************************************************** 
 * Combine all the temp files into one file
 ********************************************************************************/
var shuffledFile = fileArg + "_sliced_" + new Date().getTime() + ".wav";
var combine = combineList[Math.floor(rnd()*combineList.length)];
var joinedFiles = shuffle.shuffle({deck:inputFiles}).cards.join(" ");
exec("sox " + joinedFiles + " " + shuffledFile + " --combine " + combine + " --guard " + outputRateString + " repeat " + repeatFinalAudioTimes);
shell.rm(tempFilePrefix + "*.wav");
exec(playCommand + " " + shuffledFile);


/******************************************************************************** 
 * Utils
 ********************************************************************************/
function rnd(){
  return Math.random();
}

function exec(command){
  if(verbose){ console.log(command.replace(/&& sox/g,"&& \nsox")); }
  var output = shell.exec(command, {silent:true}).output;
  if(verbose){ console.log(output); }
}

function alterSlices(soxEffectCallback, percentOfFilesEffected){
  if(percentOfFilesEffected <= 0) return;
  var actionDeck = shuffle.shuffle({deck:inputFiles});
  var randomSet = actionDeck.draw(Math.floor(actionDeck.length() * percentOfFilesEffected));

  if(!(randomSet instanceof Array)){
    randomSet = [randomSet];
  } 

  for(var i=0;i<randomSet.length;i++){
    var file = randomSet[i];
    var alterSampleCommand = "sox '" + file + "' '" + tempFilePrefix + file + "' " + soxEffectCallback() + 
                             " && mv '" + tempFilePrefix + file + "' '" + file + "'";
    alterCommands.push(alterSampleCommand);
  }
}


