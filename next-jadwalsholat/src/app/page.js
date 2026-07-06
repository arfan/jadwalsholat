"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { cityList, defaultCityName } from '../data/cities';

const DAY_NAMES = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', "JUM'AT", 'SABTU'];
const DEFAULT_CITY_INDEX = cityList.findIndex((city) => city.city === defaultCityName);
const FALLBACK_CITY_INDEX = DEFAULT_CITY_INDEX >= 0 ? DEFAULT_CITY_INDEX : 0;
const DEFAULT_MASJID_LABEL = 'MASJID';
const DEFAULT_MASJID_NAME = 'AL-MANAR';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatClock(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatDate(date) {
  return `${pad2(date.getDate())}:${pad2(date.getMonth() + 1)}:${String(date.getFullYear()).slice(-4)}`;
}

function formatCountdown(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

function getValidCityIndex(value) {
  const index = Number(value);
  return Number.isInteger(index) && cityList[index] ? index : FALLBACK_CITY_INDEX;
}

function buildPrayerTimes(index) {
  if (typeof window === 'undefined' || !window.adhan || !window.moment) {
    return null;
  }

  const city = cityList[index] ?? cityList[FALLBACK_CITY_INDEX];
  const coordinates = new window.adhan.Coordinates(city.lat, city.lng);
  const params = window.adhan.CalculationMethod.Singapore();
  params.adjustments.fajr = 2;
  params.adjustments.dhuhr = 3;
  params.adjustments.asr = 2;
  params.adjustments.maghrib = 3;
  params.adjustments.isha = 2;

  const prayerTimes = new window.adhan.PrayerTimes(coordinates, new Date(), params);
  const timezone = city.timezone * 60;
  const momentLib = window.moment;

  const moments = {
    fajr: momentLib(prayerTimes.fajr).utcOffset(timezone),
    sunrise: momentLib(prayerTimes.sunrise).utcOffset(timezone),
    dhuhr: momentLib(prayerTimes.dhuhr).utcOffset(timezone),
    asr: momentLib(prayerTimes.asr).utcOffset(timezone),
    maghrib: momentLib(prayerTimes.maghrib).utcOffset(timezone),
    isha: momentLib(prayerTimes.isha).utcOffset(timezone)
  };

  const display = {
    fajr: moments.fajr.format('HH:mm'),
    sunrise: moments.sunrise.format('HH:mm'),
    dhuhr: moments.dhuhr.format('HH:mm'),
    asr: moments.asr.format('HH:mm'),
    maghrib: moments.maghrib.format('HH:mm'),
    isha: moments.isha.format('HH:mm')
  };

  return { city, moments, display };
}

function computePrayerUi(momentLib, prayerMoments) {
  if (!momentLib || !prayerMoments) {
    return {
      activeKey: null,
      counterTitle: 'SIAP-SIAP',
      counterTime: '-00:00'
    };
  }

  const now = momentLib();
  const checks = [
    { key: 'fajr', prepareMinutes: 10, iqomahMinutes: 15 },
    { key: 'dhuhr', prepareMinutes: 10, iqomahMinutes: 10 },
    { key: 'asr', prepareMinutes: 10, iqomahMinutes: 10 },
    { key: 'maghrib', prepareMinutes: 10, iqomahMinutes: 10 },
    { key: 'isha', prepareMinutes: 10, iqomahMinutes: 10 }
  ];

  for (const check of checks) {
    const prayerMoment = prayerMoments[check.key];
    const diffMs = prayerMoment.valueOf() - now.valueOf();
    const prepareWindow = check.prepareMinutes * 60 * 1000;
    const iqomahWindow = check.iqomahMinutes * 60 * 1000;

    if (diffMs > 0 && diffMs < prepareWindow) {
      return {
        activeKey: check.key,
        counterTitle: 'SIAP-SIAP',
        counterTime: formatCountdown(diffMs)
      };
    }

    if (diffMs < 0 && diffMs > -iqomahWindow) {
      return {
        activeKey: check.key,
        counterTitle: 'IQOMAH',
        counterTime: formatCountdown(iqomahWindow + diffMs)
      };
    }
  }

  return {
    activeKey: null,
    counterTitle: 'SIAP-SIAP',
    counterTime: '-00:00'
  };
}

function findBestSelectionIndex(query, fallbackIndex) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return fallbackIndex;
  }

  const matches = cityList
    .map((city, index) => ({ city, index }))
    .filter((entry) => entry.city.city.toLowerCase().includes(normalized));

  const exactMatch = matches.find((entry) => entry.city.city.toLowerCase() === normalized);
  if (exactMatch) {
    return exactMatch.index;
  }

  if (matches.length === 1) {
    return matches[0].index;
  }

  return null;
}

export default function Page() {
  const [clockText, setClockText] = useState('99:99');
  const [dateText, setDateText] = useState('99:99:99');
  const [dayName, setDayName] = useState('DAYS');
  const [masjidName1, setMasjidName1] = useState(DEFAULT_MASJID_LABEL);
  const [masjidName2, setMasjidName2] = useState(DEFAULT_MASJID_NAME);
  const [locationIndex, setLocationIndex] = useState(FALLBACK_CITY_INDEX);
  const [prayerDisplay, setPrayerDisplay] = useState({
    fajr: '99:99',
    sunrise: '99:99',
    dhuhr: '99:99',
    asr: '99:99',
    maghrib: '99:99',
    isha: '99:99'
  });
  const [prayerUi, setPrayerUi] = useState({
    activeKey: null,
    counterTitle: 'SIAP-SIAP',
    counterTime: '-00:00'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityIndex, setSelectedCityIndex] = useState(FALLBACK_CITY_INDEX);

  const locationIndexRef = useRef(FALLBACK_CITY_INDEX);
  const prayerMomentsRef = useRef(null);
  const countdownSimulationRef = useRef(null);
  const searchInputRef = useRef(null);

  const currentCity = cityList[locationIndex] ?? cityList[FALLBACK_CITY_INDEX];

  const filteredCities = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return cityList
      .map((city, index) => ({ city, index }))
      .filter((entry) => normalized === '' || entry.city.city.toLowerCase().includes(normalized));
  }, [searchQuery]);

  const refreshPrayerTime = (index) => {
    if (typeof window === 'undefined') {
      return;
    }

    const prayerInfo = buildPrayerTimes(index);
    if (!prayerInfo) {
      return;
    }

    prayerMomentsRef.current = prayerInfo.moments;
    setPrayerDisplay(prayerInfo.display);
    setPrayerUi(computePrayerUi(window.moment, prayerInfo.moments));
  };

  const applyLocation = (index) => {
    const nextIndex = cityList[index] ? index : FALLBACK_CITY_INDEX;
    locationIndexRef.current = nextIndex;
    setLocationIndex(nextIndex);
    setSelectedCityIndex(nextIndex);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('masjid_location', String(nextIndex));
    }

    refreshPrayerTime(nextIndex);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const savedName1 = window.localStorage.getItem('masjid_name_1');
    const savedName2 = window.localStorage.getItem('masjid_name_2');
    const savedLocation = window.localStorage.getItem('masjid_location');
    const initialLocation = getValidCityIndex(savedLocation);

    if (savedLocation === null || savedLocation !== String(initialLocation)) {
      window.localStorage.setItem('masjid_location', String(initialLocation));
    }

    const initialName1 = savedName1 ?? DEFAULT_MASJID_LABEL;
    const initialName2 = savedName2 ?? DEFAULT_MASJID_NAME;
    setMasjidName1(initialName1);
    setMasjidName2(initialName2);
    window.localStorage.setItem('masjid_name_1', initialName1);
    window.localStorage.setItem('masjid_name_2', initialName2);

    locationIndexRef.current = initialLocation;
    setLocationIndex(initialLocation);
    setSelectedCityIndex(initialLocation);
    refreshPrayerTime(initialLocation);

    const updateClock = () => {
      const now = new Date();
      setClockText(formatClock(now));
      setDateText(formatDate(now));
      setDayName(DAY_NAMES[now.getDay()]);
      const simulation = countdownSimulationRef.current;
      if (simulation) {
        const remainingMs = simulation.endsAt - now.valueOf();
        if (remainingMs > 0) {
          setPrayerUi({
            activeKey: 'fajr',
            counterTitle: simulation.title,
            counterTime: formatCountdown(remainingMs)
          });
        } else {
          countdownSimulationRef.current = null;
          setPrayerUi(computePrayerUi(window.moment, prayerMomentsRef.current));
        }
      } else if (prayerMomentsRef.current) {
        setPrayerUi(computePrayerUi(window.moment, prayerMomentsRef.current));
      }
    };

    updateClock();
    const tickTimer = window.setInterval(updateClock, 1000);
    const prayerTimer = window.setInterval(() => {
      refreshPrayerTime(locationIndexRef.current);
    }, 60 * 60 * 1000);

    return () => {
      window.clearInterval(tickTimer);
      window.clearInterval(prayerTimer);
    };
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      searchInputRef.current?.focus();
    }
  }, [isModalOpen]);

  const openModal = () => {
    setSelectedCityIndex(locationIndexRef.current);
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const editMasjidText = (storageKey, currentValue, setter, promptLabel) => {
    const nextValue = window.prompt(promptLabel, currentValue);
    if (nextValue === null || nextValue.trim() === '') {
      return;
    }

    const trimmedValue = nextValue.trim();
    setter(trimmedValue);
    window.localStorage.setItem(storageKey, trimmedValue);
  };

  const handleEditableKeyDown = (event, edit) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      edit();
    }
  };

  const editMasjidLabel = () => editMasjidText(
    'masjid_name_1', masjidName1, setMasjidName1, 'Ubah label masjid:'
  );

  const editMasjidName = () => editMasjidText(
    'masjid_name_2', masjidName2, setMasjidName2, 'Ubah nama masjid:'
  );

  const startCountdownSimulation = (title, minutes) => {
    countdownSimulationRef.current = {
      title,
      endsAt: Date.now() + minutes * 60 * 1000
    };
    setPrayerUi({
      activeKey: 'fajr',
      counterTitle: title,
      counterTime: formatCountdown(minutes * 60 * 1000)
    });
  };

  const stopCountdownSimulation = () => {
    countdownSimulationRef.current = null;
    setPrayerUi(computePrayerUi(window.moment, prayerMomentsRef.current));
  };

  const handleCitySearchChange = (event) => {
    const nextQuery = event.target.value;
    setSearchQuery(nextQuery);
    setSelectedCityIndex(findBestSelectionIndex(nextQuery, locationIndexRef.current));
  };

  const handleCityClick = (index) => {
    setSelectedCityIndex(index);
    setSearchQuery(cityList[index].city);
  };

  const confirmSelection = () => {
    const nextIndex = selectedCityIndex ?? filteredCities[0]?.index ?? locationIndexRef.current;
    applyLocation(nextIndex);
    setIsModalOpen(false);
  };

  const handleCitySearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmSelection();
    }
  };

  const isActive = prayerUi.activeKey !== null;
  const tableOpacity = (key) => {
    if (!isActive) {
      return 1;
    }
    return prayerUi.activeKey === key ? 1 : 0.3;
  };

  return (
    <>
      <table width="100%" height="100%" id="main_table">
        <tbody>
          <tr height="40%">
            <td colSpan="2">
              <table width="100%" height="100%" id="clock_date">
                <tbody>
                  <tr height="50%">
                    <td align="center"><div id="clock">{clockText}</div></td>
                  </tr>
                  <tr height="25%">
                    <td align="center"><div id="date">{dateText}</div></td>
                  </tr>
                  <tr height="25%">
                    <td align="center"><div id="day_name">{dayName}</div></td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td colSpan="4" align="center">
              <table height="100%" id="masjid_name_location">
                <tbody>
                  <tr height="30%">
                    <td align="center">
                      <div id="masjid_name_1" className="editable-masjid-text" onClick={editMasjidLabel} onKeyDown={(event) => handleEditableKeyDown(event, editMasjidLabel)} role="button" tabIndex={0} title="Klik untuk mengubah label masjid">
                        {masjidName1}
                      </div>
                    </td>
                  </tr>
                  <tr height="40%">
                    <td align="center">
                      <div id="masjid_name_2" className="editable-masjid-text" onClick={editMasjidName} onKeyDown={(event) => handleEditableKeyDown(event, editMasjidName)} role="button" tabIndex={0} title="Klik untuk mengubah nama masjid">
                        {masjidName2}
                      </div>
                    </td>
                  </tr>
                  <tr height="30%">
                    <td align="center">
                      <div id="masjid_location" onClick={openModal} role="button" tabIndex={0}>
                        {currentCity.city}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr height="30%">
            <td colSpan="5">
              <table height="100%" width="100%" id="counter" style={{ opacity: isActive ? 1 : 0 }}>
                <tbody>
                  <tr>
                    <td width="50%"><div id="count_title">{prayerUi.counterTitle}</div></td>
                    <td width="50%"><div id="count_time">{prayerUi.counterTime}</div></td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr height="30%" className="prayer-row">
            <td width="16.6%">
              <table height="100%" width="100%" className="prayer_time_name" id="fajrTable" style={{ opacity: tableOpacity('fajr') }}>
                <tbody>
                  <tr height="70%"><td align="center"><div className="prayer_time" id="fajrTime">{prayerDisplay.fajr}</div></td></tr>
                  <tr height="30%" valign="top"><td align="center"><div className="prayer_name">SUBUH</div></td></tr>
                </tbody>
              </table>
            </td>
            <td width="16.6%">
              <table height="100%" width="100%" className="prayer_time_name" id="sunriseTable" style={{ opacity: tableOpacity('sunrise') }}>
                <tbody>
                  <tr height="70%"><td align="center"><div className="prayer_time" id="sunriseTime">{prayerDisplay.sunrise}</div></td></tr>
                  <tr height="30%" valign="top"><td align="center"><div className="prayer_name">TERBIT</div></td></tr>
                </tbody>
              </table>
            </td>
            <td width="16.6%">
              <table height="100%" width="100%" className="prayer_time_name" id="dhuhrTable" style={{ opacity: tableOpacity('dhuhr') }}>
                <tbody>
                  <tr height="70%"><td align="center"><div className="prayer_time" id="dhuhrTime">{prayerDisplay.dhuhr}</div></td></tr>
                  <tr height="30%" valign="top"><td align="center"><div className="prayer_name">DZUHUR</div></td></tr>
                </tbody>
              </table>
            </td>
            <td width="16.6%">
              <table height="100%" width="100%" className="prayer_time_name" id="asrTable" style={{ opacity: tableOpacity('asr') }}>
                <tbody>
                  <tr height="70%"><td align="center"><div className="prayer_time" id="asrTime">{prayerDisplay.asr}</div></td></tr>
                  <tr height="30%" valign="top"><td align="center"><div className="prayer_name">ASHAR</div></td></tr>
                </tbody>
              </table>
            </td>
            <td width="16.6%">
              <table height="100%" width="100%" className="prayer_time_name" id="maghribTable" style={{ opacity: tableOpacity('maghrib') }}>
                <tbody>
                  <tr height="70%"><td align="center"><div className="prayer_time" id="maghribTime">{prayerDisplay.maghrib}</div></td></tr>
                  <tr height="30%" valign="top"><td align="center"><div className="prayer_name">MAGHRIB</div></td></tr>
                </tbody>
              </table>
            </td>
            <td width="16.6%">
              <table height="100%" width="100%" className="prayer_time_name" id="ishaTable" style={{ opacity: tableOpacity('isha') }}>
                <tbody>
                  <tr height="70%"><td align="center"><div className="prayer_time" id="ishaTime">{prayerDisplay.isha}</div></td></tr>
                  <tr height="30%" valign="top"><td align="center"><div className="prayer_name">ISYA</div></td></tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="countdown-simulator" aria-label="Simulasi hitung mundur">
        <button type="button" onClick={() => startCountdownSimulation('SIAP-SIAP', 10)}>Simulasi SIAP-SIAP</button>
        <button type="button" onClick={() => startCountdownSimulation('IQOMAH', 10)}>Simulasi IQOMAH</button>
        <button type="button" onClick={stopCountdownSimulation}>Reset</button>
      </div>

      {isModalOpen ? (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Pilih Kota</h2>
              <span className="modal-close" onClick={closeModal} role="button" tabIndex={0}>&times;</span>
            </div>
            <div className="modal-body">
              <input
                ref={searchInputRef}
                type="text"
                id="city-search"
                placeholder="Cari kota..."
                autoComplete="off"
                value={searchQuery}
                onChange={handleCitySearchChange}
                onKeyDown={handleCitySearchKeyDown}
              />
              <div id="city-results" className="city-results">
                {filteredCities.length === 0 ? (
                  <div className="city-result-empty">Kota tidak ditemukan</div>
                ) : (
                  filteredCities.map(({ city, index }) => (
                    <button
                      key={`${city.code}-${index}`}
                      type="button"
                      className={`city-result-item ${index === selectedCityIndex ? 'is-selected' : ''}`}
                      onClick={() => handleCityClick(index)}
                    >
                      {city.city}
                    </button>
                  ))
                )}
              </div>
              <button className="modal-ok" onClick={confirmSelection}>OK</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
