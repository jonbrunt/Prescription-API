const fs = require("fs"); // Node's File System module for standard POSIX-like functionality
const axios = require("axios"); // lightweight HTTP client for Node.js

const URL = "http://api-sandbox.pillpack.com/"; // base URL for API calls

// API calls and invocation of data handling on success
const prescriptions = axios.get(`${URL}prescriptions`); // axios GET for full rx list
prescriptions
  .then(scripts => { // asynchronous handling of return
    const medications = axios.get(`${URL}medications`); // axios GET for full med list
    medications
      .then(meds => {
        processData(scripts.data, meds.data); // invoke data processing function upon return from API
      })
      .catch(err => { // error handling
        console.log("There was an error while processing the medications GET request: ", err);
      });
  })
  .catch(err => {
    console.log("There was an error while processing the prescriptions GET request: ", err);
  });

// function to process data and return JSON of prescription updates
const processData = (rxs, meds) => {
  const update = []; // instantiate empty array to push update object into
  rxs.forEach(rx => { // iterate over each prescription
    const match = meds.find(val => val.id === rx.medication_id); // find rx's med
    if (!match.generic) { // protect from updating an already generic prescription
      // filter and return only positive matches for the same rxcui and positive generic status
      const genericResult = meds.filter(med => {
        return med.rxcui === match.rxcui && med.generic === true; // match generic meds with same rxcui as rx
      });
      if (genericResult.length > 0) { // if above found a generic substitution(s)
        update.push({ // add to update
          prescription_id: rx.id,
          medication_id: genericResult[0].id // arbitrarily select first generic match if more than one found
        });
      }
    }
  });
  const data = JSON.stringify({ prescription_updates: update }); // create JSON object and stringify it
  fs.writeFile("update.json", data, err => { // write/overwrite data to update.json in root
    if (err) console.log("There was an error while processing the data: ", err); // error handling
    console.log('The prescription updates have been saved in the root to "update.json".'); // log success to terminal
  });
};
