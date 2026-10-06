const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

// 수정: 분리된 팝업은 네트워크 요청 없이 마크업을 한 번만 생성해야 합니다.
test('external popup markup mounts once, before map and picker scripts, with local asset paths', () => {
  const html = read('../Reservation.html/Reservation.html');
  assert.match(html, /id="station-picker-mount"/);
  assert.doesNotMatch(html, /<dialog id="station-dialog"/);
  assert.ok(html.indexOf('station-dialog-template.js') < html.indexOf('js/map-region.js'));
  let markup = '';
  const mount = {insertAdjacentHTML(where, value){markup += value;}};
  const context = vm.createContext({document:{getElementById(id){return id === 'station-picker-mount' ? mount : id === 'station-dialog' && markup ? {} : null;}}});
  const script = read('station-picker/js/station-dialog-template.js');
  vm.runInContext(script, context);
  vm.runInContext(script, context);
  assert.equal((markup.match(/id="station-dialog"/g)||[]).length, 1);
  assert.equal((markup.match(/class="map-region /g)||[]).length, 16);
  assert.equal((markup.match(/role="tab"/g)||[]).length, 3);
  for(const match of markup.matchAll(/src="([^"]+)"/g)) assert.ok(fs.existsSync(path.join(__dirname,match[1])),match[1]);
  assert.doesNotMatch(markup, /style=|<style/);
});

// 수정: 목록·검색·지도 선택이 팝업을 연 역에만 반영되고, 닫기/재열기를 유지합니다.
test('departure and arrival use list, search, map, dismiss and focus restoration independently', () => {
  function element(){return {value:'',hidden:true,attributes:{},events:{},textContent:'',
    classList:{toggle(){},remove(){}},querySelectorAll(){return [];},
    addEventListener(type,fn){(this.events[type] ||= []).push(fn);},
    emit(type,event={}){for(const fn of this.events[type]||[])fn(event);},
    setAttribute(key,value){this.attributes[key]=value;},focus(){this.focused=true;},
    showModal(){this.open=true;},close(){this.open=false;this.emit('close');}};}
  const departure=element(),arrival=element();
  departure.span={textContent:'서울'};arrival.span={textContent:'부산'};
  departure.querySelector=()=>departure.span;arrival.querySelector=()=>arrival.span;
  const ids=Object.fromEntries(['station-dialog','station-dialog-title','station-input','station-search-apply','popular-stations','region-chips','region-stations','station-results','station-results-title','station-results-list','station-tabs-wrap','station-panel-major','station-panel-region','station-panel-map'].map(x=>[x,element()]));
  const tabs=['major','region','map'].map(tab=>Object.assign(element(),{dataset:{tab}}));
  const events={};
  const document={getElementById:id=>ids[id],querySelector:s=>s==='.departure-field'?departure:s==='.arrival-field'?arrival:null,querySelectorAll:()=>tabs,
    addEventListener(type,fn){(events[type] ||= []).push(fn);},dispatchEvent(e){for(const fn of events[e.type]||[])fn(e);}};
  const context=vm.createContext({document,Event:class{constructor(type){this.type=type;}}});
  vm.runInContext(read('station-picker/js/stations-data.js'),context);
  vm.runInContext(read('station-picker/js/station-dialog.js'),context);
  document.dispatchEvent({type:'DOMContentLoaded'});
  assert.ok(!ids['station-dialog'].open,'Page load must not open the station popup');
  departure.emit('click');
  assert.equal(ids['station-dialog-title'].textContent,'출발역 선택');
  ids['station-dialog'].emit('click',{target:{closest:s=>s==='.station-chip'?{dataset:{station:'수원'}}:null}});
  assert.equal(departure.span.textContent,'수원');assert.equal(arrival.span.textContent,'부산');
  assert.equal(departure.attributes['aria-label'],'출발역 수원');assert.ok(departure.focused);
  arrival.emit('click');
  assert.equal(ids['station-dialog-title'].textContent,'도착역 선택');
  document.dispatchEvent({type:'korail:station-selected',detail:{station:'구포'}});
  assert.equal(arrival.span.textContent,'구포');assert.equal(departure.span.textContent,'수원');
  assert.equal(ids['station-dialog'].open,false);assert.ok(arrival.focused);
  arrival.emit('click');ids['station-input'].value='강릉';ids['station-search-apply'].emit('click');
  assert.equal(arrival.span.textContent,'강릉');
  departure.emit('click');ids['station-input'].value='ㅅㅇ';ids['station-input'].emit('input');
  assert.match(ids['station-results-list'].innerHTML,/서울/);
  ids['station-dialog'].close();assert.equal(departure.span.textContent,'수원');
  document.dispatchEvent({type:'korail:station-selected',detail:{station:'부산'}});
  assert.equal(departure.span.textContent,'수원','Closed popup must ignore map selection');
  departure.emit('click');assert.equal(ids['station-input'].value,'');assert.equal(ids['station-panel-major'].hidden,false);
});
