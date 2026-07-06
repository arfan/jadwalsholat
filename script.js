// citySelect = [];
// for(let i=0;i<cityList.length;i++) {
//     citySelect.push({
//         text: cityList[i].city,
//         value: i,
//     })
// }
//
// console.log(citySelect);


function display_ct5() {
    var x = new Date()

    indonesian_days = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUM\'AT', 'SABTU']
    document.getElementById('clock').innerHTML = ("0"+x.getHours()).slice(-2) + ":" +  ("0"+x.getMinutes()).slice(-2);
    document.getElementById('date').innerHTML = ("0"+x.getDate()).slice(-2) + ":" +  ("0"+(x.getMonth()+1)).slice(-2) + ":" +  ("0"+x.getFullYear()).slice(-4);
    document.getElementById('day_name').innerHTML = indonesian_days[x.getDay()];

    enter = checkIqomahAndAlarm(fajrTime, "fajrTable", 10, 15);
    if (!enter) enter = checkIqomahAndAlarm(dhuhrTime, "dhuhrTable", 10, 10);
    if (!enter) enter = checkIqomahAndAlarm(asrTime, "asrTable", 10, 10);
    if (!enter) enter = checkIqomahAndAlarm(maghribTime, "maghribTable", 10, 10);
    if (!enter) enter = checkIqomahAndAlarm(ishaTime, "ishaTable", 10, 10);
    display_c5();
}

function checkIqomahAndAlarm(checkTime, checkTable, prepareDuration, iqomahDuration) {
    // var currentTime = moment().add('minutes', 5);
    var currentTime = moment();
    var duration = moment.duration(checkTime.diff(currentTime));
    var duration2 = moment.duration(iqomahDuration, 'minutes').subtract(moment.duration(currentTime.diff(checkTime)));

    debug = false;
    if(debug) {
        console.log("currentTime", currentTime.format("HH:mm:ss"));
        console.log(checkTable, checkTime.format("HH:mm:ss"));
        console.log("duration", duration.asMinutes());
        console.log("duration2", duration2.asMinutes());
    }

    durationMinutes = duration.asMinutes();
    if(durationMinutes < prepareDuration && durationMinutes > 0) {
        console.log("SIAP-SIAP", duration.minutes(), duration.seconds());

        document.getElementById("fajrTable").style.opacity=0.3;
        document.getElementById("sunriseTable").style.opacity=0.3;
        document.getElementById("dhuhrTable").style.opacity=0.3;
        document.getElementById("asrTable").style.opacity=0.3;
        document.getElementById("maghribTable").style.opacity=0.3;
        document.getElementById("ishaTable").style.opacity=0.3;

        document.getElementById(checkTable).style.opacity=1;
        document.getElementById("counter").style.opacity=1;
        document.getElementById("count_title").innerHTML="SIAP-SIAP";
        document.getElementById("count_time").innerHTML=("0"+duration.minutes()).slice(-2)+":"+("0"+duration.seconds()).slice(-2);

        return true;
    }
    else if(durationMinutes > -iqomahDuration && durationMinutes < 0) {
        console.log("IQOMAH");

        document.getElementById("fajrTable").style.opacity=0.3;
        document.getElementById("sunriseTable").style.opacity=0.3;
        document.getElementById("dhuhrTable").style.opacity=0.3;
        document.getElementById("asrTable").style.opacity=0.3;
        document.getElementById("maghribTable").style.opacity=0.3;
        document.getElementById("ishaTable").style.opacity=0.3;

        document.getElementById(checkTable).style.opacity=1;
        document.getElementById("counter").style.opacity=1;
        document.getElementById("count_title").innerHTML="IQOMAH";
        document.getElementById("count_time").innerHTML=("0"+duration2.minutes()).slice(-2)+":"+("0"+duration2.seconds()).slice(-2);

        return true;
    } else {
        document.getElementById("fajrTable").style.opacity=1;
        document.getElementById("sunriseTable").style.opacity=1;
        document.getElementById("dhuhrTable").style.opacity=1;
        document.getElementById("asrTable").style.opacity=1;
        document.getElementById("maghribTable").style.opacity=1;
        document.getElementById("ishaTable").style.opacity=1;

        document.getElementById("counter").style.opacity=0;
    }

    return false;
}

function display_c5(){
    var refresh=1000; // Refresh rate in milli seconds
    mytime=setTimeout('display_ct5()',refresh)
}

(function(window, document, undefined){
    window.onload = init;
    function init(){
        document.getElementById("main_body").style.height= window.innerHeight+"px";
        document.getElementById("main_body").style.width= window.innerWidth+"px";
        console.log("Screen Height: " + window.innerHeight)
        console.log("Screen Width: " + window.innerWidth)

        // set masjid name 1
        masjidName1LocalStorage = localStorage.getItem("masjid_name_1");
        if(masjidName1LocalStorage !== null) {
            document.getElementById("masjid_name_1").innerHTML = masjidName1LocalStorage;
        }

        document.getElementById("masjid_name_1").onclick = function changeMasjidName1() {
            console.log("change masjid name 1");
            masjidName1 = prompt("Masjid name 1", "MASJID");
            if(masjidName1 !==null) {
                console.log("name1:"+masjidName1);
                localStorage.setItem("masjid_name_1", masjidName1);
                document.getElementById("masjid_name_1").innerHTML = masjidName1;
            }
        }

        // set masjid name 2
        masjidName2LocalStorage = localStorage.getItem("masjid_name_2");
        if(masjidName2LocalStorage !== null) {
            document.getElementById("masjid_name_2").innerHTML = masjidName2LocalStorage;
        }

        document.getElementById("masjid_name_2").onclick = function changeMasjidName2() {
            console.log("change masjid name 2");
            masjidName2 = prompt("Masjid name 2", "AL-MANAR");
            if(masjidName2!== null) {
                console.log("name1:"+masjidName2);
                localStorage.setItem("masjid_name_2", masjidName2);
                document.getElementById("masjid_name_2").innerHTML = masjidName2;
            }
        }

        const savedLocation = localStorage.getItem("masjid_location");
        masjidLocation = getValidCityIndex(savedLocation);
        if (savedLocation === null || savedLocation !== String(masjidLocation)) {
            localStorage.setItem("masjid_location", String(masjidLocation));
        }
        document.getElementById("masjid_location").innerHTML = cityList[masjidLocation].city;

        modal = document.querySelector('.modal');
        closeButton = document.querySelector('.modal-close');
        okButton = document.querySelector('.modal-ok');
        citySearchInput = document.getElementById('city-search');
        cityResultsContainer = document.getElementById('city-results');
        selectedCityIndex = masjidLocation;

        citySearchInput.addEventListener('input', function() {
            renderCityResults(citySearchInput.value);
        });
        citySearchInput.addEventListener('focus', function() {
            renderCityResults(citySearchInput.value);
        });
        citySearchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                okModal();
            }
        });
        closeButton.addEventListener('click', hideModal);
        okButton.addEventListener('click', okModal);

        //set location
        document.getElementById("masjid_location").onclick = function changeMasjidLocation() {
            console.log("change location");
            showModal();
            // bootbox.prompt({
            //     title: 'Pilih kota',
            //     inputType: 'select',
            //     inputOptions: citySelect,
            //     callback: function (result) {
            //         console.log(result);
            //         if(result !== null) {
            //             localStorage.setItem("masjid_location", result);
            //             document.getElementById("masjid_location").innerHTML = cityList[result].city;
            //             masjidLocation = result;
            //             refreshPrayerTime();
            //         }
            //     }
            // });
        }
        readParam();
        refreshPrayerTime();
        display_c5();

        // // citySelect = [];
        // let select = document.getElementById('select-state');
        //
        // el = select.getElementsByTagName('option')
        // // alert(el.length);
        //
        // if (el.length===1 ){
        //     for(let i=0;i<cityList.length;i++) {
        //         var option = document.createElement("option");
        //         option.text = cityList[i].city;
        //         option.value = i;
        //         select.add(option);
        //
        //         // citySelect.push({
        //         //     text: cityList[i].city,
        //         //     value: i,
        //         // })
        //     }
        // }


    }
})(window, document, undefined);

let citySearchInput = null;
let cityResultsContainer = null;
let selectedCityIndex = null;

function showModal() {
    modal.style.display = 'block';
    selectedCityIndex = masjidLocation;
    citySearchInput.value = '';
    renderCityResults('');
    citySearchInput.focus();
}

function hideModal() {
    modal.style.display = 'none';
}

function okModal() {
    modal.style.display = 'none';
    if (selectedCityIndex !== null) {
        masjidLocation = selectedCityIndex;
        localStorage.setItem("masjid_location", String(masjidLocation));
        refreshPrayerTime()
    }
}

function readParam() {
    const urlParams = new URLSearchParams(window.location.search);
    masjidLocation = urlParams.get('masjidLocation');
    masjidName1 = urlParams.get('masjidName1');
    masjidName2 = urlParams.get('masjidName2');


    // alert(masjidLocation);
}

function getValidCityIndex(value) {
    const index = Number(value);
    return Number.isInteger(index) && cityList[index] ? index : getDefaultCityIndex();
}

function getDefaultCityIndex() {
    const defaultCityIndex = cityList.findIndex(function(city) {
        return city.city === 'KOTA ADM. JAKARTA SELATAN';
    });

    return defaultCityIndex >= 0 ? defaultCityIndex : 0;
}

function renderCityResults(query) {
    if (!cityResultsContainer) {
        return;
    }

    const normalizedQuery = (query || '').trim().toLowerCase();
    const matches = cityList
        .map(function(city, index) {
            return { city: city, index: index };
        })
        .filter(function(entry) {
            return normalizedQuery === '' || entry.city.city.toLowerCase().includes(normalizedQuery);
        });

    if (normalizedQuery !== '') {
        const exactMatch = matches.find(function(entry) {
            return entry.city.city.toLowerCase() === normalizedQuery;
        });

        if (exactMatch) {
            selectedCityIndex = exactMatch.index;
        } else if (matches.length === 1) {
            selectedCityIndex = matches[0].index;
        }
    }

    cityResultsContainer.innerHTML = '';

    if (matches.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'city-result-empty';
        emptyState.textContent = 'Kota tidak ditemukan';
        cityResultsContainer.appendChild(emptyState);
        selectedCityIndex = null;
        return;
    }

    matches.forEach(function(entry) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'city-result-item';
        if (entry.index === selectedCityIndex) {
            item.classList.add('is-selected');
        }
        item.textContent = entry.city.city;
        item.addEventListener('click', function() {
            selectedCityIndex = entry.index;
            citySearchInput.value = entry.city.city;
            renderCityResults(citySearchInput.value);
        });
        cityResultsContainer.appendChild(item);
    });
}

function refreshPrayerTime() {
    masjidLocation = getValidCityIndex(localStorage.getItem("masjid_location"));

    const coordinates = new adhan.Coordinates(cityList[masjidLocation].lat, cityList[masjidLocation].lng);
    const params = adhan.CalculationMethod.Singapore();
    params.adjustments.fajr = 2;
    params.adjustments.dhuhr = 3;
    params.adjustments.asr = 2;
    params.adjustments.maghrib = 3;
    params.adjustments.isha = 2;

    const date = new Date();

    var prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

    if(cityList[masjidLocation].city !== null) {
        document.getElementById('masjid_location').innerHTML = cityList[masjidLocation].city;
    }
    if(masjidName1 !== null) {
        document.getElementById('masjid_name_1').innerHTML = masjidName1;
    }
    if(masjidName2 !== null ){
        document.getElementById('masjid_name_2').innerHTML = masjidName2;
    }

    fajrTime = moment(prayerTimes.fajr).utcOffset(cityList[masjidLocation].timezone*60);
    dhuhrTime = moment(prayerTimes.dhuhr).utcOffset(cityList[masjidLocation].timezone*60);
    asrTime = moment(prayerTimes.asr).utcOffset(cityList[masjidLocation].timezone*60);
    maghribTime = moment(prayerTimes.maghrib).utcOffset(cityList[masjidLocation].timezone*60);
    ishaTime = moment(prayerTimes.isha).utcOffset(cityList[masjidLocation].timezone*60);

    document.getElementById('fajrTime').innerHTML = moment(prayerTimes.fajr).utcOffset(cityList[masjidLocation].timezone*60).format('HH:mm');
    document.getElementById('sunriseTime').innerHTML = moment(prayerTimes.sunrise).utcOffset(cityList[masjidLocation].timezone*60).format('HH:mm');
    document.getElementById('dhuhrTime').innerHTML = moment(prayerTimes.dhuhr).utcOffset(cityList[masjidLocation].timezone*60).format('HH:mm');
    document.getElementById('asrTime').innerHTML = moment(prayerTimes.asr).utcOffset(cityList[masjidLocation].timezone*60).format('HH:mm');
    document.getElementById('maghribTime').innerHTML = moment(prayerTimes.maghrib).utcOffset(cityList[masjidLocation].timezone*60).format('HH:mm');
    document.getElementById('ishaTime').innerHTML = moment(prayerTimes.isha).utcOffset(cityList[masjidLocation].timezone*60).format('HH:mm');
}

setInterval(() => {
    console.log("refresh")
    refreshPrayerTime()
}, 3600000);
