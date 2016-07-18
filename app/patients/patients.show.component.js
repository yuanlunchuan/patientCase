'use strict';

angular.
  module('patientsShow').
  component('patientsShow', {
    templateUrl: 'patients/patients.show.template.html',
    controller: ['$http', '$scope', 'ngDialog', 'ngProgressFactory', function patientsShow($http, $scope, ngDialog, ngProgressFactory) {
      var self = this;
      $scope.progressbar = ngProgressFactory.createInstance();

      self.medicationVisible = false;
      self.generalDisposalVisible = false;
      self.surgicalTreatmentVisible = false;
      self.diagnosticInformationVisible = false;
      self.diseaseHistoryVisible = false;

      var medicationsCollection = null;
      var medicationsList = {};

      var WINDOW_WIDTH = document.body.clientWidth;
      var globalVar = {
        horizontalDistance: 60,
        leftTitleWidth: 170,
        timeOffsetPercentage: 0,
        startTime: '',
        endTime: '',
        timeUnit: 'month'
      };
      self.timeUnit = [{
        text: '月',
        value: 'month'
      },{
        text: '日',
        value: 'day'
      },{
        text: '时',
        value: 'hour'
      }];
      self.currentTimeUnit=self.timeUnit[0].value;

      self.settingDialog = function () {
        ngDialog.open({
            template: `<p><a href="/#!/examine-result-config" ng-click="$ctrl.closeThisDialog()">检验结果展现配置</a></p>
              <a href="/#!/examine-target-config" ng-click="$ctrl.closeThisDialog()"><p>检验指标趋势展现配置</a></p>
              <a href="/#!/sign-display-config" ng-click="$ctrl.closeThisDialog()"><p>体征展现配置</a></p>
              <a href="/#!/sign-examine-partial-config" ng-click="$ctrl.closeThisDialog()"><p>体征测量部位标示符</a></p>
              <a href="http://www.baidu.com" ng-click="$ctrl.closeThisDialog()"><p>治疗药物检测配置</a></p>
              <a href="http://www.baidu.com" ng-click="$ctrl.closeThisDialog()"><p>疾病测配置</a></p>
              <a href="http://www.baidu.com" ng-click="$ctrl.closeThisDialog()"><p>全局展现模式配置</a></p>
              `,
            plain: true,
            scope: $scope
        });
      };

      self.closeThisDialog = function(){
        ngDialog.close();
      }

      self.expandDiseaseHistory = function(){
        console.info("run expand disease history hello");
      }

      self.medicationToggle = function(){
        self.medicationVisible = !self.medicationVisible;
      }
      
      self.generalDisposalToggle = function(){
        self.generalDisposalVisible = !self.generalDisposalVisible;
      }

      self.surgicalTreatmentToggle = function(){
        self.surgicalTreatmentVisible = !self.surgicalTreatmentVisible;
      }

      self.diagnosticInformationToggle = function(){
        self.diagnosticInformationVisible = !self.diagnosticInformationVisible;
      }
      self.diseaseHistoryToggle = function(){
        self.diseaseHistoryVisible = !self.diseaseHistoryVisible;
      }

      function getCrossBrowserElement(mouseEvent){
        var result = {
          x: 0,
          y: 0,
          relativeX: 0,
          relativeY: 0,
          currentDomId: ""
        };

        if (!mouseEvent){
          mouseEvent = window.event;
        }

        if (mouseEvent.pageX || mouseEvent.pageY){
          result.x = mouseEvent.pageX;
          result.y = mouseEvent.pageY;
        }
        else if (mouseEvent.clientX || mouseEvent.clientY){
          result.x = mouseEvent.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
          result.y = mouseEvent.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
        }

        result.relativeX = result.x;
        result.relativeY = result.y;

        if (mouseEvent.target){
          var offEl = mouseEvent.target;
          var offX = 0;
          var offY = 0;
          if (typeof(offEl.offsetParent) != "undefined"){
            while (offEl){
              offX += offEl.offsetLeft;
              offY += offEl.offsetTop;
              offEl = offEl.offsetParent;
            }
          }
          else{
            offX = offEl.x;
            offY = offEl.y;
          }

          result.relativeX -= offX;
          result.relativeY -= offY;
        }
        result.currentDomId = mouseEvent.target.id;

        return result;
      }

      function getMouseEventResult(mouseEvent, mouseEventDesc)
      {
        var coords = getCrossBrowserElement(mouseEvent);
        $scope.currentPosition = "鼠标当前的坐标："+coords.x+", "+coords.y;
        $scope.currentElementCoord = "当前坐标为("+coords.relativeX+"，"+coords.relativeY+")";
      }

      self.onMouseMove = function(event){
        getMouseEventResult(event, "Mouse move");
        if (globalVar.startTime&&self.timeIndicatorMoveing) {
          drawTimeLineIndicator(getCrossBrowserElement(event));
        }
        isSpecialElement(getCrossBrowserElement(event));
      }

      self.onTimeIndicatorMouseDown = function(event){
        self.timeIndicatorMoveing = true;
      }

      self.onTimeIndicatorMouseUp = function(event){
        self.timeIndicatorMoveing = false;
      }

      self.timeUnitChange = function(timeUnit){
        globalVar.timeUnit = timeUnit;
        globalVar.timeOffsetPercentage = 0;
        drawTimeLineIndicator();
        drawTimeLine({
          canvasContext: 'time-line-canvas'
        });
      }

      self.onConfirmButtonClicked = function(){
        globalVar.startTime = self.startTime;
        globalVar.endTime = self.endTime;
        $scope.progressbar.start();
        var config = {
          params: {
            startDate: self.startTime.replace(/-/g, "/"),
            endDate: self.endTime.replace(/-/g, "/"),
            mrNo: '000000413016'
          },
          headers : {
            'Accept' : 'application/json'
          }
        };
        //暂时硬编码数据
        onLoadMedicationsSuccess(data);
        //$http.get('http://192.168.0.14:8080/chsp/medications', config).then(onLoadMedicationsSuccess, onLoadMedicationsFailure);
      }

      function onLoadMedicationsSuccess(event){
        $scope.progressbar.complete();
        medicationsCollection = event.data;
        var maxLineBar = (WINDOW_WIDTH - globalVar.leftTitleWidth)/globalVar.horizontalDistance;

        if(maxLineBar>getTotalMonth(self.startTime, self.endTime)){
          self.currentTimeUnit=self.timeUnit[1].value;
        }
        if (maxLineBar>getTotalDay(self.startTime, self.endTime)){
          self.currentTimeUnit=self.timeUnit[2].value;
        }
        globalVar.timeOffsetPercentage = 0;
        drawTimeLine({
          canvasContext: 'time-line-canvas'
        });
      }

      function onLoadMedicationsFailure(event){
        $scope.progressbar.complete();
        alert("-----error: "+JSON.stringify(event));
      }

      function log(message){
        console.info(message);
      }

      function isSpecialElement(element){
        if ('mediacationContentCanvas'==element.currentDomId) {
          var timeLineLength = getTotalDay(globalVar.startTime, globalVar.endTime)*globalVar.horizontalDistance;
          var totalOffsetDistance = timeLineLength-(WINDOW_WIDTH-globalVar.leftTitleWidth);

          var offsetDistance = globalVar.timeOffsetPercentage*totalOffsetDistance;
          var absoluteX = offsetDistance+element.relativeX;

          var totalTime = (new Date(globalVar.endTime)) - (new Date(globalVar.startTime));
          var specialPoint = (absoluteX*totalTime)/timeLineLength+(new Date(globalVar.endTime)).getTime();
          if (1457742240000<(new Date(specialPoint)).getTime()&&1458033120000>(new Date(specialPoint)).getTime()){
            //alert("-------a special day");
          }
        }
      }

      function drawTimeLineIndicator(mousePoint){
        if(mousePoint&&((mousePoint.x-globalVar.leftTitleWidth)<0||(mousePoint.x>WINDOW_WIDTH-40))){
          return;
        }
        var timeIndicatorContextWidth = WINDOW_WIDTH - globalVar.leftTitleWidth;
        var timeIndicatorContext = document.getElementById('time-indicator').getContext('2d');
        timeIndicatorContext.canvas.width = timeIndicatorContextWidth;

        timeIndicatorContext.clearRect(0,0,(WINDOW_WIDTH-globalVar.leftTitleWidth),100);
        timeIndicatorContext.fillStyle = brgba("#55A7FB",0.9);

        var shouldSlid = false;
        if (globalVar.startTime){
          if('month'==self.currentTimeUnit&&timeIndicatorContextWidth<differMonth(globalVar.startTime, globalVar.endTime)*globalVar.horizontalDistance){
            shouldSlid = true;
          }
          if ('day'==self.currentTimeUnit&&timeIndicatorContextWidth<differDay(globalVar.startTime, globalVar.endTime)*globalVar.horizontalDistance){
            shouldSlid = true;
          }
          if ('hour'==self.currentTimeUnit&&timeIndicatorContextWidth<differHour(globalVar.startTime, globalVar.endTime)*globalVar.horizontalDistance){
            shouldSlid = true;
          }
        }
        if (shouldSlid&&mousePoint) {
          var timeOffsetPercentage = (mousePoint.x - globalVar.leftTitleWidth)/((WINDOW_WIDTH - globalVar.leftTitleWidth)-40);
          $scope.timePersent = "进度比例为："+timeOffsetPercentage;
          globalVar.timeOffsetPercentage = timeOffsetPercentage;
          timeIndicatorContext.fillRect((mousePoint.x-globalVar.leftTitleWidth), 0, 30, 20);

          drawTimeLine({
            canvasContext: 'time-line-canvas'
          });
        }else{
          timeIndicatorContext.fillRect(0,0,30,20);
        }
      }

      function getTotalMonth(startTime, endTime){
        var startYear = parseInt(startTime.split('-')[0]),
          startMonth = parseInt(startTime.split('-')[1]),
          endYear = parseInt(endTime.split('-')[0]),
          endMonth = parseInt(endTime.split('-')[1]);

        return endYear*12+endMonth-startYear*12-startMonth;
      }

      function getTotalDay(startTime, endTime){
        var dateArray, startDate, endDate, totalDay;

        dateArray = startTime.split("-");
        startDate = new Date(dateArray[0]+ '-' + dateArray[1] + '-' + dateArray[2]);

        dateArray = endTime.split("-");
        endDate = new Date(dateArray[0] + '-' + dateArray[1] + '-' + dateArray[2]);
        totalDay = parseInt(Math.abs(startDate-endDate)/1000/60/60/24);
        return totalDay;
      }

      function getTotalHour(startTime,  endTime){
        return 24*getTotalDay(startTime,  endTime);
      }

      function addDate(date,days){
        var d = new Date(date);
        d.setDate(d.getDate()+days);
        var m = d.getMonth()+1;
        return d.getFullYear()+'-'+m+'-'+d.getDate();
      }

      function differMonth(startTime, endTime){
        var startTotalMonth = parseInt(startTime.split('-')[0]*12)+parseInt(startTime.split('-')[1]);
        var endTotalMonth = parseInt(endTime.split('-')[0])*12+parseInt(endTime.split('-')[1]);
        return (endTotalMonth-startTotalMonth);
      }

      function differDay(startTime, endTime){
        return ((new Date(endTime))-(new Date(startTime)))/1000/3600/24;
      }

      function differHour(startTime, endTime){
        return ((new Date(endTime))-(new Date(startTime)))/1000/3600;
      }

      function brgba(hex, opacity) {
        if( ! /#?\d+/g.test(hex) ) return hex;
        var h = hex.charAt(0) == "#" ? hex.substring(1) : hex,
            r = parseInt(h.substring(0,2),16),
            g = parseInt(h.substring(2,4),16),
            b = parseInt(h.substring(4,6),16),
            a = opacity;
        return "rgba(" + r + "," + g + "," + b + "," + a + ")";
      }

      function drawItemContentGrid(options){
        var offsetLineBar = getOffsetLineBar();
        var canvasContext = document.getElementById(options.canvasContext).getContext('2d');
        var perLineHeight = options.perLineHeight||30;
        var itemLineLength = (WINDOW_WIDTH-globalVar.leftTitleWidth);

        canvasContext.canvas.height = options.totalItem*perLineHeight;
        canvasContext.canvas.width = itemLineLength;
        canvasContext.clearRect(0,0,(options.totalItem*perLineHeight),itemLineLength);

        for (var i = 0; i < options.totalItem; i++) {
          canvasContext.beginPath();
          canvasContext.strokeStyle = "#000";
          canvasContext.moveTo(0, perLineHeight*i);
          canvasContext.lineTo(itemLineLength, perLineHeight*i);
          canvasContext.stroke();
        }

        var totalVerticalLine = parseInt(itemLineLength/globalVar.horizontalDistance);
        var horizontalDistance = globalVar.horizontalDistance;
        var lineHeight = options.totalItem*perLineHeight;
        for (var i = 0; i < totalVerticalLine; i++) {
          canvasContext.beginPath();
          canvasContext.strokeStyle = "#000";
          canvasContext.moveTo(options.startPosition+horizontalDistance*i, 0);
          canvasContext.lineTo(options.startPosition+horizontalDistance*i, lineHeight);
          canvasContext.stroke();
        }

        var startTime,
          startTimeMillisecond,
          endTimeMillisecond;

        //暂时以一个月三十天进行计算
        if ("month"== globalVar.timeUnit){
          startTimeMillisecond = (new Date(globalVar.startTime)).getTime()+offsetLineBar*30*24*3600*1000;
          endTimeMillisecond = (new Date(globalVar.startTime)).getTime()+(totalVerticalLine+offsetLineBar)*30*24*3600*1000;
        }
        if ("day"==globalVar.timeUnit){
          startTime = addDate(globalVar.startTime, offsetLineBar);
          startTimeMillisecond = (new Date(startTime)).getTime();
          endTimeMillisecond = (new Date(addDate(startTime, totalVerticalLine))).getTime();
        }
        if ("hour"==globalVar.timeUnit){
          startTimeMillisecond = (new Date(globalVar.startTime)).getTime()+offsetLineBar*3600*1000;
          endTimeMillisecond = (new Date(globalVar.startTime)).getTime()+(totalVerticalLine+offsetLineBar)*3600*1000;
        }

        var contentLength = WINDOW_WIDTH-globalVar.leftTitleWidth-options.startPosition;
        for (var i = 0; i < medicationsCollection.length; i++) {
          for (var j = 0; j < medicationsCollection[i].drugs.length; j++) {
            var m = 1;
            for(var key in medicationsList){
              if (key==medicationsCollection[i].drugs[j].drugCode) {
                break;
              }
              m++;
            }
            var pointY = m*40-20;
            var startDateMillisecond = (new Date(medicationsCollection[i].drugs[j].startDate)).getTime();
            var endDateMillisecond = medicationsCollection[i].drugs[j].endDate&&(new Date(medicationsCollection[i].drugs[j].endDate)).getTime();
            if (endDateMillisecond&&(startTimeMillisecond<startDateMillisecond&&endTimeMillisecond>startDateMillisecond)){
              var startPointX = contentLength/((endTimeMillisecond-startTimeMillisecond)/(startDateMillisecond-startTimeMillisecond));
              var endPointX = contentLength/((endTimeMillisecond-startTimeMillisecond)/(endDateMillisecond-startTimeMillisecond));
              drawLine({
                canvasContext: 'mediacationContentCanvas',
                startPointX: startPointX,
                startPointY: pointY,
                endPointX: endPointX,
                endPointY: pointY,
                lineDistanceToBottom: 5
              });
            }
            for (var k = 0; k < medicationsCollection[i].drugs[j].mars.length; k++) {
              var execTime = medicationsCollection[i].drugs[j].mars[k].execTime;
              var execTimeMillisecond = (new Date(execTime)).getTime();
              if (startTimeMillisecond<execTimeMillisecond&&endTimeMillisecond>execTimeMillisecond){
                var pointX = contentLength/((endTimeMillisecond-startTimeMillisecond)/(execTimeMillisecond-startTimeMillisecond));

                drawRectanglePoint({
                  canvasContext: 'mediacationContentCanvas',
                  centerPointX: pointX,
                  centerPointY: pointY,
                  rectangleLength: 10
                });
              }
            }
          }
        }
      }

      function drawItemTitle(options){
        var canvasContext = document.getElementById(options.canvasContext).getContext('2d');
        var perLineHeight = options.perLineHeight||30;
        var itemLineLength = options.itemLineLength||100;

        canvasContext.canvas.height = options.items.length*perLineHeight;
        canvasContext.canvas.width = itemLineLength;

        for (var i = 0; i < options.items.length; i++) {
          canvasContext.beginPath();
          canvasContext.strokeStyle = options.lineColor||'#000';
          canvasContext.moveTo(0, perLineHeight*i);
          canvasContext.lineTo(itemLineLength, perLineHeight*i);
          canvasContext.stroke();

          canvasContext.beginPath();
          canvasContext.strokeStyle = '#f00';
          canvasContext.lineWidth = 2;
          canvasContext.moveTo(itemLineLength, perLineHeight*i);
          canvasContext.lineTo(itemLineLength, perLineHeight*(i+1)-3);
          canvasContext.stroke();

          canvasContext.font = options.textFont||"16px Courier New";
          canvasContext.fillStyle = options.textColor||"gray";

          canvasContext.textAlign="start";
          var fontStartPosition = 5;
          canvasContext.fillText(options.items[i].itemTitle, fontStartPosition, perLineHeight*(i+1)-perLineHeight*0.3);
        }
      }

      function getTotalLineBar(){
        var totalLineBar = 0;
        if ('month'==globalVar.timeUnit) {
          totalLineBar = getTotalMonth(globalVar.startTime, globalVar.endTime);
        }
        if ('day'==globalVar.timeUnit) {
          totalLineBar = getTotalDay(globalVar.startTime, globalVar.endTime); 
        }
        if ('hour'==globalVar.timeUnit) {
          totalLineBar = getTotalHour(globalVar.startTime, globalVar.endTime); 
        }
        return totalLineBar;
      }

      function getTimeLineLength(){
        return (getTotalLineBar()-1)*globalVar.horizontalDistance;
      }
      function contentCanvasLength(){
        return (WINDOW_WIDTH - globalVar.leftTitleWidth);
      }

      function getOffsetLineBar(){
        var offsetLineBar = 0;
        var offsetPosition = getOffsetPosition();
        while((offsetPosition-(globalVar.horizontalDistance*offsetLineBar))>0){
          offsetLineBar++;
        }
        return offsetLineBar;
      }

      function getOffsetPosition(){
        return (getTimeLineLength() - contentCanvasLength())*globalVar.timeOffsetPercentage;
      }

      function getTotalTimeLine(){
        return parseInt((WINDOW_WIDTH - globalVar.leftTitleWidth)/globalVar.horizontalDistance);
      }

      function drawTimeLine(options){
        var canvasContext = document.getElementById(options.canvasContext).getContext('2d');
        var canvasLength = WINDOW_WIDTH - globalVar.leftTitleWidth;
        canvasContext.clearRect(0, 0, canvasLength, 20);
        canvasContext.canvas.width = canvasLength;
        var totalLineBar = getTotalLineBar();
        var timeLineLength = getTimeLineLength();
        var offsetLineBar = getOffsetLineBar();

        var startPosition = globalVar.horizontalDistance*offsetLineBar - getOffsetPosition();

        var totalTimeLine = getTotalTimeLine();
        for (var i = 0; i < totalTimeLine; i++) {
          canvasContext.beginPath();
          canvasContext.strokeStyle = options.lineColor||'#000';
          canvasContext.moveTo(startPosition+i*globalVar.horizontalDistance, 0);
          canvasContext.lineTo(startPosition+i*globalVar.horizontalDistance, 15);
          canvasContext.stroke();
        }
        var hashOptions = {
          totalLineBar: totalLineBar,
          totalTimeLine: totalTimeLine,
          canvasContext: options.canvasContext
        };

        if ('month'==globalVar.timeUnit) {
          drawTimeLineByMonth(hashOptions);
        }
        if ('day' ==globalVar.timeUnit) {
          drawTimeLineByDay(hashOptions);
        }
        if ('hour'==globalVar.timeUnit) {
          drawTimeLineByHour(hashOptions);
        }
        updateContentCanvas({
          startPosition: startPosition
        });
      }

      function updateContentCanvas(options){
        for (var i = 0; i < medicationsCollection.length; i++) {
          for (var j = 0; j < medicationsCollection[i].drugs.length; j++) {
            medicationsList[medicationsCollection[i].drugs[j].drugCode] = medicationsCollection[i].drugs[j].goodsDesc||medicationsCollection[i].drugs[j].drugDesc;
          }
        }
        var drugCollection = [];
        for(var key in medicationsList){
          drugCollection.push({
            itemCode: key,
            itemTitle: medicationsList[key]
          });
        }

        drawItemTitle({
          canvasContext: 'medicationTitleCanvas',
          perLineHeight: 40,
          itemLineLength: 140,
          lineColor: "#f00",
          textFont: '16px Courier New',
          textColor: 'gray',
          items: drugCollection
        });

        drawItemContentGrid({
          canvasContext: 'mediacationContentCanvas',
          perLineHeight: 40,
          totalItem: drugCollection.length,
          startPosition: options.startPosition,
          drugCollection: drugCollection,
          medicationsCollection: medicationsCollection
        });
      }

      function drawTimeLineByMonth(options){
        var canvasContext = document.getElementById(options.canvasContext).getContext('2d');
        var startTime = globalVar.startTime.split('-'),
            startYear = parseInt(startTime[0]),
            startMonth = parseInt(startTime[1]),
            startDay = parseInt(startTime[2]),

            endTime = globalVar.endTime.split('-'),
            endYear = parseInt(endTime[0]),
            endMonth = parseInt(endTime[1]),
            endDay = parseInt(endTime[2]);
        var offsetLineBar = getOffsetLineBar();
        var startPosition = globalVar.horizontalDistance*offsetLineBar - getOffsetPosition();

        startYear = startYear + parseInt((startMonth+offsetLineBar)/12);
        startMonth =parseInt((startMonth+offsetLineBar)%12);
        startMonth -= 1;

        for (var i = 0; i < options.totalTimeLine; i++) {
          var currentTime = "";
          var currentYear = startYear+parseInt((startMonth+i)/12);
          var currentMonth = (parseInt((startMonth+i)%12)+1)<10 ? '0'+(parseInt((startMonth+i)%12)+1) : (parseInt((startMonth+i)%12)+1);

          currentTime = currentMonth+'月';
          ((parseInt((startMonth+i)%12)+1)==1)&&(currentTime = currentYear+'年'+currentMonth+'月');
          (0==i)&&(currentTime = currentYear+'年');

          canvasContext.textAlign="start";

          if(0==i){
            canvasContext.fillText(currentTime, startPosition+i*globalVar.horizontalDistance, 24);
          }else{
            canvasContext.fillText(currentTime, startPosition+i*globalVar.horizontalDistance-10, 24);
          }
        }
      }

      function drawTimeLineByDay(options){
        var canvasContext = document.getElementById(options.canvasContext).getContext('2d');
        
        var offsetLineBar = getOffsetLineBar();
        var startPosition = globalVar.horizontalDistance*offsetLineBar - getOffsetPosition();
        var startTime = addDate(globalVar.startTime, offsetLineBar),
            startYear = parseInt(startTime[0]),
            startMonth = parseInt(startTime[1]),
            startDay = parseInt(startTime[2]);

        for (var i = 0; i < options.totalTimeLine; i++) {
          var currentTime = "",
            currentYear = addDate(startTime, i).split('-')[0],
            currentMonth = parseInt(addDate(startTime, i).split('-')[1]),
            currentDay = addDate(startTime, i).split('-')[2];

            currentMonth = parseInt(currentMonth/10)==0 ? "0"+currentMonth : currentMonth;
            currentDay = parseInt(currentDay/10)==0 ? "0"+currentDay : currentDay;

          1!=currentDay&&(currentTime=currentDay+"日");
          1==currentDay&&(currentTime=currentMonth+"月"+currentDay+"日");
          0==i&&(currentTime = currentYear+"年"+currentMonth+"月"+currentDay+"日");

          canvasContext.textAlign="start";
          if(0==i){
            canvasContext.fillText(currentTime, startPosition+i*globalVar.horizontalDistance-30, 24);
          }else{
            canvasContext.fillText(currentTime, startPosition+i*globalVar.horizontalDistance-10, 24);
          }
        }
      }

      function drawTimeLineByHour(options){
        var canvasContext = document.getElementById(options.canvasContext).getContext('2d');
        var offsetLineBar = getOffsetLineBar();
        var startPosition = globalVar.horizontalDistance*offsetLineBar - getOffsetPosition();

        var startTime = addDate(globalVar.startTime, parseInt(offsetLineBar/24)),
            startYear = parseInt(startTime[0]),
            startMonth = parseInt(startTime[1]),
            startDay = parseInt(startTime[2]),
            startHour = offsetLineBar%24;

        for (var i = 0; i < options.totalTimeLine; i++) {
          var currentTime = "",
            currentYear = addDate(startTime, parseInt(i/24)).split('-')[0]%100,
            currentMonth = parseInt(addDate(startTime, parseInt(i/24)).split('-')[1]),
            currentDay = addDate(startTime, parseInt(i/24)).split('-')[2],
            currentHour = (startHour+i)%24;

          currentMonth = parseInt(currentMonth/10)==0 ? "0"+currentMonth : currentMonth;
          currentDay = parseInt(currentDay/10)==0 ? "0"+currentDay : currentDay;
          currentHour = parseInt(currentHour/10)==0 ? "0"+currentHour : currentHour;

          0!=currentHour&&(currentTime = currentHour+"时");
          0==currentHour&&(currentTime = currentDay+"日"+currentHour+"时");
          0==i&&(currentTime = currentYear+"年"+currentMonth+"月"+currentDay+"日"+currentHour+"时");
          //currentTime = currentHour+"时";
          //log("---------currentTime: "+currentYear+"年"+currentMonth+"月"+currentDay+"日"+currentTime);

          canvasContext.textAlign="start";
          if(0==i){
            canvasContext.fillText(currentTime, startPosition+i*globalVar.horizontalDistance-40, 24);
          }else{
            canvasContext.fillText(currentTime, startPosition+i*globalVar.horizontalDistance-10, 24);
          }
        }
      }

      function drawRectanglePoint(options){
        var canvasContext = document.getElementById(options.canvasContext).getContext('2d');

        canvasContext.fillStyle=options.fillStyle||"#000000";
        canvasContext.strokeStyle=options.strokeStyle||"#000000";
        canvasContext.linewidth=options.linewidth||1;
        canvasContext.fillRect(options.centerPointX-parseInt(options.rectangleLength/2), options.centerPointY-parseInt(options.rectangleLength/2), options.rectangleLength, options.rectangleLength);
        canvasContext.strokeRect(options.centerPointX-parseInt(options.rectangleLength/2), options.centerPointY-parseInt(options.rectangleLength/2), options.rectangleLength, options.rectangleLength);
      }

      function drawCirclePoint(options){
        var canvasContext = configCanvas(options);

        canvasContext.beginPath();
        canvasContext.arc(options.centerPointX, options.centerPointY, options.radius, 0, Math.PI*2, true);
        canvasContext.closePath();
        canvasContext.fill();
        canvasContext.stroke();
        drawMinus(options);
      }

      function drawPlusSymbol(options){
        var canvasContext = configCanvas(options);
        canvasContext.moveTo(options.centerPointX-options.radius, options.centerPointY);
        canvasContext.lineTo(options.centerPointX+options.radius, options.centerPointY);

        canvasContext.moveTo(options.centerPointX, options.centerPointY-options.radius);
        canvasContext.lineTo(options.centerPointX, options.centerPointY+options.radius);
        canvasContext.stroke();
      }

      function drawMinus(options){
        var canvasContext = configCanvas(options);
        canvasContext.moveTo(options.centerPointX-options.radius, options.centerPointY);
        canvasContext.lineTo(options.centerPointX+options.radius, options.centerPointY);
        canvasContext.stroke();
      }

      function configCanvas(options){
        var canvasContext = document.getElementById(options.canvasContext).getContext('2d');

        options.fillStyle&&(canvasContext.fillStyle=options.fillStyle);
        options.strokeStyle&&(canvasContext.strokeStyle=options.strokeStyle);
        canvasContext.lineWidth=options.lineWidth||1;
        return canvasContext;
      }

      function drawLine(options){
        var canvasContext = configCanvas(options);
        canvasContext.moveTo(options.startPointX, options.startPointY);
        canvasContext.lineTo(options.startPointX+options.lineDistanceToBottom, options.startPointY-options.lineDistanceToBottom);
        canvasContext.lineTo(options.endPointX-options.lineDistanceToBottom, options.endPointY-options.lineDistanceToBottom);
        canvasContext.lineTo(options.endPointX, options.endPointY);
        canvasContext.stroke();
      }

      function initialize(){
        drawTimeLineIndicator();
      }
      initialize();
    }
  ]});