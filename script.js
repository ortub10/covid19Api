const xValues = ["Confirmed", " Deaths", "Recovered", "critical"];
const yValues = [0, 0, 0, 0, 0];

let lastContinent;
let graph;

function drawChart(xValues, yValues, type) {
  graph = new Chart("myChart", {
    type: type,
    data: {
      labels: xValues,
      datasets: [
        {
          backgroundColor: "blue",
          data: yValues,
        },
      ],
    },
    options: {
      legend: { display: false },
      title: {
        display: true,
        text: "Covid 19 statistic",
      },
    },
  });
}

drawChart(xValues, yValues, "bar");

const getFetchedData = async (url) => {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (e) {
    console.log(e);
  }
};

async function filData() {
  const mainArrData = [];

  const arrContinents = ["americas", "africa", "asia", "europe", "oceania"];

  const urls = [];

  for (const element of arrContinents) {
    urls.push(`https://restcountries.herokuapp.com/api/v1/region/${element}`);
  }

  const requests = urls.map((url) => getFetchedData(url));

  const tempData = {};

  await Promise.all(requests)
    .then((responses) => {
      responses.forEach((response, index) => {
        const arrCountries = [];
        response.forEach((country) => {
          arrCountries.push(country.name.common);
        });
        tempData[`${arrContinents[index]}`] = arrCountries;
      });
    })
    .catch((e) => console.log(e));

  const countriesApi = await getFetchedData(
    " https://corona-api.com/countries"
  );

  for (const continent of arrContinents) {
    const objContinent = {
      name: continent,
    };

    const countriesOfContinent = [];

    for (const country of tempData[continent]) {
      const objCountry = countriesApi.data.find(
        (item) => item.name === country
      );

      if (objCountry !== undefined) {
        const objCountryForContinent = {
          name: country,
          data: {
            total_cases: objCountry.latest_data.confirmed,
            new_cases: objCountry.today.confirmed,
            total_deaths: objCountry.latest_data.deaths,
            new_deaths: objCountry.today.deaths,
            total_recovered: objCountry.latest_data.recovered,
            in_critical_condition: objCountry.latest_data.critical,
          },
        };

        countriesOfContinent.push(objCountryForContinent);
      }

      objContinent.countries = countriesOfContinent;
    }

    mainArrData.push(objContinent);
  }
  return { mainArrData: mainArrData, tempData: tempData };
}
function fillSelect(mainData, continent, tempData) {
  const select = document.getElementById("category");
  select.innerHTML = "";
  select.innerHTML = `<option id="mainOp" value = "">Chose country</option>`;
  for (country of tempData[continent]) {
    const continentObj = mainData.find(
      (continentTemp) => continentTemp.name === continent
    );
    const countryObj = continentObj.countries.find(
      (countryTemp) => countryTemp.name === country
    );
    if (countryObj !== undefined) {
      const option = `<option value=${country.replaceAll(
        " ",
        "_"
      )}>${country}</option>`;
      select.innerHTML += option;
    }
  }
}
function fillChartForContinents(mainData, continent) {
  let total_cases = 0;
  let total_deaths = 0;
  let total_recovered = 0;
  let in_critical_condition = 0;
  const countries = mainData.find((obj) => obj.name === continent);
  countries.countries.forEach((country) => {
    total_cases += country.data.total_cases;
    total_deaths += country.data.total_deaths;
    total_recovered += country.data.total_recovered;
    in_critical_condition += country.data.in_critical_condition;
  });

  drawChart(
    xValues,
    [total_cases, total_deaths, total_recovered, in_critical_condition],
    "bar"
  );
}

function eventButtonCcontinent(datas) {
  const buttons = document.querySelectorAll(".continent");
  const mainData = datas.mainArrData;
  const tempData = datas.tempData;
  for (const button of buttons) {
    button.addEventListener("click", (evt) => {
      const continent = evt.target.value;
      lastContinent = continent;
      document.querySelector("h1").innerText = evt.target.innerText;
      graph.destroy();
      fillSelect(mainData, continent, tempData);
      fillChartForContinents(mainData, continent);
    });
  }
}

function eventButtonSpecific(datas) {
  const buttons = document.querySelectorAll(".specific");
  const mainData = datas.mainArrData;
  for (const button of buttons) {
    button.addEventListener("click", (evt) => {
      const countriesNameArr = [];
      const countriesNunberArr = [];
      const continent = lastContinent;
      if (continent !== undefined) {
        document.getElementById("mainOp").setAttribute("selected", "selected");
        document.getElementById("mainOp").removeAttribute("selected");
        const option = evt.target.value;
        const continentObj = mainData.find((obj) => obj.name === continent);
        continentObj.countries.forEach((country) => {
          countriesNameArr.push(country.name);
          countriesNunberArr.push(country.data[option]);
        });
        graph.destroy();
        drawChart(countriesNameArr, countriesNunberArr, "line");
      }
    });
  }
}
function eventSelect(datas) {
  const mainData = datas.mainArrData;
  const select = document.getElementById("category");
  select.addEventListener("change", (evt) => {
    const country = evt.target.value.replaceAll("_", " ");
    if (country !== "") {
      const continent = lastContinent;
      fillChartForSelect(mainData, continent, country);
    }
  });
}
function fillChartForSelect(mainData, continent, country) {
  const continentObj = mainData.find((obj) => obj.name === continent);
  const countryObj = continentObj.countries.find((obj) => obj.name === country);
  if (countryObj !== undefined) {
    const data = countryObj.data;
    const yInnerValues = [
      data.total_cases,
      data.new_cases,
      data.total_deaths,
      data.new_deaths,
      data.total_recovered,
      data.in_critical_condition,
    ];
    const xInnerValues = [
      "total cases",
      "new cases",
      "total deaths",
      "new deaths",
      " total recovered",
      " in critical condition",
    ];
    graph.destroy();
    drawChart(xInnerValues, yInnerValues, "line");
  }
}
async function start() {
  const datas = await filData();
  document.getElementById("spiner").removeAttribute("class");
  document.getElementById("none").removeAttribute("id");
  eventButtonCcontinent(datas);
  eventButtonSpecific(datas);
  eventSelect(datas);
}
start();
