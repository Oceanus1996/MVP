
// 初始化地图
var map = L.map('map').setView([-3.56518,143.619995], 5); // 使用Wewak, New Guinea作为初始中心

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//全局变量modal
var modal = document.getElementById("myModal");
//全局变量markerArray
var markerArray=[];
//全局变量血条计数
var grabbedMarkersCount = 0;
//标签的click事件
function openModal(){
    modal.style.display ="block";
    displayRecordData(this.recordData);}
// 玩家
let playerLevel = 1;
const EXPERIENCE_TO_LEVEL_UP = 3; // 每3经验点升级


//close按钮
var closeButton = document.querySelector(".close");
//关闭
closeButton.addEventListener("click",function(){
    modal.style.display ="none";
});
//记录这个标记的url
function displayRecordData(textContent,image,title){
    var  modelContent = document.querySelector(".model-content p")
    var  modelpicture = document.querySelector(".model-content img")
    var  modelTitle = document.querySelector(".model-content h1")
    modelContent.textContent = textContent;
    if(image != null){
        modelpicture.src = image;
    }else{
        modelpicture.alt="NO pictures";
    }
    modelTitle.textContent= title;
}

//update 血条
function updateHealthBar(){
    let experiencePercentage = (grabbedMarkersCount / EXPERIENCE_TO_LEVEL_UP) * 100;

    // 更新经验条的宽度
    document.querySelector('.progress').style.width = experiencePercentage + '%';
    console.log("Actual width of the progress bar:", document.querySelector('.progress').style.width);

    // 判断是否升级
    if (grabbedMarkersCount >= EXPERIENCE_TO_LEVEL_UP) {
        playerLevel++;
        grabbedMarkersCount = 0;
        document.querySelector('.level').textContent = 'Level' + playerLevel;
        document.querySelector('.progress').style.width = '0%'; // 经验条归零
    }
    
    // 更新血条
    var label = document.getElementById("healthBar");
    label.textContent = "血条：" + grabbedMarkersCount ;
};

//事件触发时发送ajax到php
function handleMarkerClick(url,image,marker){
    console.log("handleMarkerClick function called with URL:", url);
    var isGrab =marker.isGrab;
    $.ajax({
        url:"mvp.php",
        method:"POST",
        data:{urlToFetch:url},
        success:function(response){
            response = response.replace(/\[an error occurred while processing this directive\]/g, '');
            let $content = $(response);
            let title = $content.filter("title").text();
            let textContent = $content.find('div#page > div#main > div#col1 > div#col1_content > div.module.content_12col > div.container > div.story > div.story_body.description').text();
            displayRecordData(textContent,image,title);
            //血条计数 
            if(!isGrab){
                grabbedMarkersCount++;
                console.log("Marker was not grabbed before. New count:", grabbedMarkersCount);
                updateHealthBar(grabbedMarkersCount);
            } else {
                console.log("Marker was already grabbed before.");
            }
            marker.isGrab = true;
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching data:", textStatus, errorThrown);
        }
    });
}

//加标记点的文档
function addPointToMap(lat, lon,recordValue) {
    var marker =L.marker([lat, lon]).addTo(map);
    marker.isGrab = false;
    var supportClick = false;
    markerArray.push(marker);
    //数据存储到marker对象中
    marker.recordData =recordValue.URL;//url储存了
    marker.image = recordValue['Primary image'];
    //点击时执行括号(事件监听器)
    marker.on("click",function(e){
        //监听点击
        //询问框，询问是否挖掘
        showConfirmationPopup(e.target,function(result){
            supportClick = result;
            if(supportClick){
                openModal.call(marker);
                handleMarkerClick(this.recordData,this.image,marker);
                console.log(this.image+" image");
                console.log(this.recordData+" url");
                marker.setIcon(customIcon);
            }
        }.bind(this));             
    });
}
//询问框
function showConfirmationPopup(clickedMarker, callback) {
    var popupContent = `
        <p>Dig now?</p>
        <button id="startGrab">Sure</button>
        <button id="noGrab">Not yet</button>
    `;
    clickedMarker.bindPopup(popupContent).openPopup();
    document.getElementById("startGrab").addEventListener('click',function(){
        console.log("实现了吗")
        if (typeof callback === "function") {
            console.log("实现了吗2");
            callback(true);
        }
        clickedMarker.closePopup();
        clickedMarker.unbindPopup();
    });
    document.getElementById("noGrab").addEventListener('click',function(){
        clickedMarker.closePopup();
        if (typeof callback === "function") {
            callback(false);
        }
    });
    
}


function iterateRecords(data) {
    $.each(data.result.records, function(recordKey, recordValue) {
        const brisbaneSuburbs = [
            "Brisbane","Brisbane-City","South Brisbane", "West End","Fortitude Valley","Woolloongabba","Indooroopilly",
            ,"Toowong","Chermside","Fairfield", "Milton","South Bank", "Wynnum", "Lytton",
            "Albion","Bowen Hills","Herston", "New Farm","Taringa","Annerley", "Ashgrove","Bardon", "Bulimba", "Kangaroo Point",
            "Kelvin Grove", "Mount Gravatt"
        ];
        if(brisbaneSuburbs.includes(recordValue.Place)){
            var latitude = recordValue.Latitude +(Math.random() * 0.2 - 0.1)
            var Longitude = recordValue.Longitude + (Math.random() * 0.2 - 0.1)
            if(latitude && Longitude){
                addPointToMap(latitude,Longitude,recordValue)
        
            }
            
            }
    }
    )
}

$(document).ready(function() {

    var data = {
        resource_id: "d73f2a2a-c271-4edd-ac45-25fd7ad2241f", // to change to a different dataset, change the resource_id
        limit: 8500,
    }

//输入坐标增加标记
    $.ajax({
        url: "https://data.gov.au/data/api/3/action/datastore_search", // if the dataset is coming from a different data portal, change the url (i.e. data.gov.au)
        data: data,
        dataType: "jsonp", // We use "jsonp" to ensure AJAX works correctly locally (otherwise XSS).
        cache: true,
        success: function(data) {
            iterateRecords(data);
        }
    });      
})  ;

//点击打开视窗
document.addEventListener("DOMContentLoaded",function(){
});

//button功能，显示当前地址
function showCurrent(){
    if (navigator.geolocation){
        
        navigator.geolocation.getCurrentPosition(function (position){
            var pos = L.latLng(position.coords.latitude,position.coords.longitude);
            L.marker([position.coords.latitude, position.coords.longitude],{icon:customIcon}).addTo(map);
            //定位并放大地图
            map.setView(pos,13);
            //让其他过远的点都不可见
            markerArray.forEach(function(marker){
                console.log("跑了吗");
                var distance= pos.distanceTo(marker.getLatLng());
                if (distance <= 10*200){
                    marker.setOpacity(1);
                }else if (distance <= 10*400) {
                    marker.setOpacity(0.5);
                }else{
                    marker.setOpacity(0);
                }
            })

        });
    }else{
        alert("Where are you?");
    }
}

//锚点格式,需要调整*
var customIcon = L.icon({
    iconUrl: 'icon.png',    // 图标的URL
    iconSize: [38, 95],       // 图标的大小
    iconAnchor: [22, 94],     // 图标的锚点位置，使图标的这个点正好对齐于地图上的对应点
    popupAnchor: [-3, -76]    // 如果你想为这个标记添加一个popup，这个是popup的锚点位置
});


