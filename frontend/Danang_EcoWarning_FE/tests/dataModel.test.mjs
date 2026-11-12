import {test} from 'node:test';
import assert from 'node:assert/strict';
import {numericValue,historyView,calendarLabel,observationsCsv} from '../src/workspace/dataModel.js';
test('zero survives, blanks and missing values never become zero',()=>{
 assert.equal(numericValue('0'),0);for(const v of [null,undefined,'','  ','NaN'])assert.equal(numericValue(v),null);
});
test('conflict gaps remain gaps and do not affect the value range',()=>{
 const h={timeSeries:[{id:1,timestamp:'2021-01-01T00:00:00',value:'18'},{id:2,timestamp:'2022-01-01T00:00:00',value:'17.5',quality:'CONFLICT'}],quality:{trendSeries:[{timestamp:'2021-01-01T00:00:00',value:'18'},{timestamp:'2022-01-01T00:00:00',value:null,quality:'CONFLICT'}]}};
 const v=historyView(h);assert.equal(v.records.length,2);assert.equal(v.trend[1].number,null);assert.equal(v.min,18);assert.equal(v.max,18);assert.equal(v.trend[1].label,'2022');
});
test('calendar labels preserve the source day and export preserves source values',()=>{
 assert.equal(calendarLabel('2022-01-01T00:00:00'),'01/01/2022');const csv=observationsCsv([{id:3,timestamp:'2022-01-01T00:00:00',value:'17.5000001',quality:'CONFLICT'}]);assert(csv.includes('17.5000001'));assert(csv.includes('CONFLICT'));
});
