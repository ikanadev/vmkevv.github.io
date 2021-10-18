// @ts-check
// import L from 'leaflet';
/**
 * @typedef DataItem
 * @property {string} id
 * @property {string} name
 * @property {string} fId
 * @property {string} idPredio
 * @property {string} tipoObjeto
 * @property {string} codCat
 * @property {string} supCc
 * @property {string} zonaUtm
 * @property {string} numberDocument
 * @property {string} dateDocument
 * @property {string} parcela
 * @property {string} departamento
 * @property {string} provincia
 * @property {string} section
 * @property {string} surface
 * @property {string} mode
 * @property {string} size
 * @property {string} owner
 * @property {{lng: number; lat: number;}[][]} coords
 * 
 * @typedef Owner
 * @property {string} name
 * @property {string[]} terrains
 */
  
const setupMap = () => {
  let map = L.map('map').setView([-16.61810676039034,-68.29287535704033], 14);
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 22,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1
	}).addTo(map);
  return map;
};

/** @type {() => Promise<GeolocationPosition, string>} */
const getLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) reject('Su navegador no soporta GPS');
  navigator.geolocation.getCurrentPosition(resolve, (err) => reject(err.message));
});

/** @type {(owners: Owner[]) => void} */
const setUpOptions = (owners) => {
  /** @type {HTMLSelectElement} */
  const selectEl = document.querySelector('#users select');
  owners.forEach((owner) => {
    const option = document.createElement('option');
    option.value = owner.name;
    option.text = owner.name;
    selectEl.add(option);
  });
};

const hideDataCont = () => {
  // @ts-ignore
  document.querySelector('#data').style.display = 'none';
}
const showDataCont = () => {
  // @ts-ignore
  document.querySelector('#data').style.display = 'block';
}

/** @type {(data: DataItem) => void} */
const showData = (data) => {
  const dataEl = document.querySelector('#data')
  const dataCont = document.querySelector('#data_cont')
  dataCont.innerHTML = `
    <p>
      <strong>Código:</strong>
      <span>${data.codCat}</span>
    </p>
    <p>
      <strong>Departamento:</strong>
      <span>${data.departamento}</span>
    </p>
    <p>
      <strong>Código predio:</strong>
      <span>${data.idPredio}</span>
    </p>
    <p>
      <strong>Número documento:</strong>
      <span>${data.numberDocument}</span>
    </p>
    <p>
      <strong>Sección:</strong>
      <span>${data.section}</span>
    </p>
    <p>
      <strong>Superficie:</strong>
      <span>${Math.round(parseFloat(data.surface.replace(',', '.'))*10000)} m² (${data.surface}) Ha</span>
    </p>
    <p>
      <strong>Parcel:</strong>
      <span>${data.parcela}</span>
    </p>
    <p>
      <strong>De:</strong>
      <span>${data.owner}</span>
    </p>
  `;
  // @ts-ignore
  dataEl.style.display = 'block';
};

/** @type {(items: DataItem[], map: L.Map) => L.Polygon[]} */
const drawTerrains = (items, map) => {
  /** @type {L.Polygon[]} */
  const polygons = [];
  items.forEach((item) => {
    item.coords.forEach((coord) => {
      polygons.push(
        L.polygon(
          coord.map((coord) => [coord.lat, coord.lng]),
          {color: 'red', stroke: false, fillOpacity: 0.75},
        ).addTo(map).addEventListener('click', () => {
          showData(item);
          showDataCont();
        })
      );
    })
  });
  return polygons;
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const map = setupMap();
    const dataResp = await fetch('./data.json');
    const ownersResp = await fetch('./owners.json');
    /** @type {{[key: string]: DataItem}} */
    const data = await dataResp.json();
    /** @type {Owner[]} */
    const owners = await ownersResp.json();
    /** @type {HTMLSelectElement} */
    const selectEl = document.querySelector('#users select');
    /** @type {L.Polygon[]} */
    let polygons = [];
    
    selectEl.onchange = (e) =>{
      hideDataCont();
      if (polygons.length >= 0) {
        polygons.forEach((poly) => {
          poly.remove();
        })
      }
      /** @type {string} */
      // @ts-ignore
      const text = e.target.value;
      const owner = owners.find((owner) => owner.name === text);
      if (!owner) return;
      const terrains = [];
      owner.terrains.map((id) => {
        terrains.push(data[id]);
      });
      polygons = drawTerrains(terrains, map);
    }

    setUpOptions(owners)
    const location = await getLocation();
    const marker = L.marker([location.coords.latitude, location.coords.longitude]).addTo(map);
    setInterval(async () => {
      const location = await getLocation();
      marker.setLatLng([location.coords.latitude, location.coords.longitude])
    }, 5000);
  } catch (e) {
    alert(e);
  }
});