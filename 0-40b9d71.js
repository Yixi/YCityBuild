!function(e){function t(t){for(var o,i,u=t[0],s=t[1],c=t[2],l=0,h=[];l<u.length;l++)i=u[l],Object.prototype.hasOwnProperty.call(n,i)&&n[i]&&h.push(n[i][0]),n[i]=0;for(o in s)Object.prototype.hasOwnProperty.call(s,o)&&(e[o]=s[o]);for(d&&d(t);h.length;)h.shift()();return a.push.apply(a,c||[]),r()}function r(){for(var e,t=0;t<a.length;t++){for(var r=a[t],o=!0,u=1;u<r.length;u++){var s=r[u];0!==n[s]&&(o=!1)}o&&(a.splice(t--,1),e=i(i.s=r[0]))}return e}var o={},n={0:0},a=[];function i(t){if(o[t])return o[t].exports;var r=o[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,i),r.l=!0,r.exports}i.m=e,i.c=o,i.d=function(e,t,r){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(i.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)i.d(r,o,function(t){return e[t]}.bind(null,o));return r},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="";var u=window.webpackJsonp=window.webpackJsonp||[],s=u.push.bind(u);u.push=t,u=u.slice();for(var c=0;c<u.length;c++)t(u[c]);var d=s;a.push([5,1,2]),r()}([,function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(3),n=function(){var e=this;this.road=[[45,53],[44,53],[44,52],[46,53],[46,52],[46,51],[46,50],[47,50],[48,48],[48,49],[48,50],[48,51],[48,52],[49,50],[50,50],[51,50],[51,52],[51,51],[52,50],[53,50],[53,51]],this.initMap=function(t,r){e.map=o.chunk(o.range(t*r).map((function(e){return{x:Math.floor(e/r),y:e%t,info:{}}})),t)}};t.store=new n},function(e,t){var r;r=function(){return this}();try{r=r||new Function("return this")()}catch(e){"object"==typeof window&&(r=window)}e.exports=r},,function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e){e[e.ROAD=0]="ROAD",e[e.TREE=1]="TREE"}(t.MESH_TYPE||(t.MESH_TYPE={}))},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(0),n=r(6),a=document.getElementById("renderCanvas"),i=document.getElementById("fps"),u=new o.Engine(a,!0),s=n.createScene(u,a);u.runRenderLoop((function(){s.render(),i.textContent=u.getFps().toFixed()}))},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(0),n=r(7),a=r(9),i=r(11),u=r(12);t.createScene=function(e,t){var r=new o.Scene(e);return n.initMap(r,100,100),i.initCamera(r,t,100,100),r.createDefaultLight(!0),u.buildRoads(r),a.buildTrees(r),u.clickToBuildRoad(r),r}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(0),n=r(1);t.initMap=function(e,t,r){var a=o.MeshBuilder.CreateGround("ground",{width:t,height:r},e),i=new o.StandardMaterial("ground-material",e);i.diffuseColor=new o.Color3(.462,.76,.404),a.material=i,a.position=new o.Vector3(t/2,0,r/2),n.store.initMap(t,r)}},function(e,t){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children||(e.children=[]),Object.defineProperty(e,"loaded",{enumerable:!0,get:function(){return e.l}}),Object.defineProperty(e,"id",{enumerable:!0,get:function(){return e.i}}),e.webpackPolyfill=1),e}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o,n=r(0),a=r(10),i=r(3),u=r(1),s=r(4);t.buildTrees=function(e){o||(o=a.createTree(e),e.removeMesh(o)),i.range(i.random(100,300)).forEach((function(){var t=o.clone(),r=i.random(10,90),a=i.random(10,90);u.store.map[r][a].mesh?e.removeMesh(t):(u.store.map[r][a].mesh=t,u.store.map[r][a].meshType=s.MESH_TYPE.TREE,t.position=new n.Vector3(r,0,a),t.addRotation(0,i.random(0,Math.PI,!0),0))}))}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(0);t.createTree=function(e){var t=new o.StandardMaterial("trunk",e);t.diffuseColor=new o.Color3(.37,.27,.207);var r=new o.StandardMaterial("leaf",e);r.diffuseColor=new o.Color3(.3,.45,.24);var n=o.MeshBuilder.CreateBox("trunk",{size:.2,height:.7},e);n.material=t,n.position=new o.Vector3(0,.35,0);var a=o.MeshBuilder.CreateBox("leaf",{size:.6,height:1},e);return a.material=r,a.position=new o.Vector3(0,1.2,0),o.Mesh.MergeMeshes([n,a],!0,!0,void 0,!1,!0)}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(0);t.initCamera=function(e,t,r,n){new o.ArcRotateCamera("Camera",Math.PI/4,Math.PI/180*50,20,new o.Vector3(r/2,0,n/2),e).attachControl(t,!0)}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(0),n=r(13),a=r(1),i=r(4),u=function(e){var t=e[0],r=e[1],o=[a.store.map[t+1][r].meshType,a.store.map[t][r-1].meshType,a.store.map[t-1][r].meshType,a.store.map[t][r+1].meshType],u=o.filter((function(e){return e===i.MESH_TYPE.ROAD})),c=a.store.map[t][r].info;4===u.length?c.type=n.ROAD_TYPE.CROSSROAD:3===u.length?(c.type=n.ROAD_TYPE.T_INTERSECTION,c.rotate=s(o)):2===u.length?o[0]===i.MESH_TYPE.ROAD&&o[2]===i.MESH_TYPE.ROAD?c.type=n.ROAD_TYPE.HORIZONTAL:o[1]===i.MESH_TYPE.ROAD&&o[3]===i.MESH_TYPE.ROAD?c.type=n.ROAD_TYPE.VERTICAL:(c.type=n.ROAD_TYPE.CONNER,o[0]===i.MESH_TYPE.ROAD&&o[1]===i.MESH_TYPE.ROAD?c.rotate=Math.PI/2:o[0]===i.MESH_TYPE.ROAD&&o[3]===i.MESH_TYPE.ROAD?c.rotate=2*Math.PI:o[1]===i.MESH_TYPE.ROAD&&o[2]===i.MESH_TYPE.ROAD?c.rotate=Math.PI:o[2]===i.MESH_TYPE.ROAD&&o[3]===i.MESH_TYPE.ROAD&&(c.rotate=Math.PI/2*3)):1===u.length&&(o[0]===i.MESH_TYPE.ROAD||o[2]===i.MESH_TYPE.ROAD?c.type=n.ROAD_TYPE.HORIZONTAL:c.type=n.ROAD_TYPE.VERTICAL)},s=function(e){var t=e.map((function(e){return e===i.MESH_TYPE.ROAD}));return t[1]?t[2]?t[3]?t[0]?0:Math.PI/2*3:Math.PI:Math.PI/2:0};t.buildRoads=function(e){a.store.road.forEach((function(e){var t=e[0],r=e[1];a.store.map[t][r].meshType=i.MESH_TYPE.ROAD})),a.store.road.forEach(u),a.store.road.forEach((function(t){var r=t[0],o=t[1];a.store.map[r][o].mesh=n.createRoad(e,r,o,a.store.map[r][o].info.type,a.store.map[r][o].info.rotate)}))};var c=function(e,t,r){u([e,t]),a.store.map[e][t].mesh&&a.store.map[e][t].mesh.dispose(),a.store.map[e][t].mesh=n.createRoad(r,e,t,a.store.map[e][t].info.type,a.store.map[e][t].info.rotate)};t.clickToBuildRoad=function(e){e.onPointerObservable.add((function(t){switch(t.type){case o.PointerEventTypes.POINTERTAP:var r=Math.round(t.pickInfo.pickedPoint.x),n=Math.round(t.pickInfo.pickedPoint.z);a.store.map[r][n].meshType=i.MESH_TYPE.ROAD,function(e,t,r){for(var o=e-1;o<=e+1;o++)for(var n=t-1;n<=t+1;n++)a.store.map[o][n].meshType===i.MESH_TYPE.ROAD&&c(o,n,r)}(r,n,e)}}))}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o,n=r(0);!function(e){e[e.HORIZONTAL=0]="HORIZONTAL",e[e.VERTICAL=1]="VERTICAL",e[e.CONNER=2]="CONNER",e[e.T_INTERSECTION=3]="T_INTERSECTION",e[e.CROSSROAD=4]="CROSSROAD"}(o=t.ROAD_TYPE||(t.ROAD_TYPE={})),t.ROAD_NAME="road";t.createRoad=function(e,r,a,i,u){void 0===i&&(i=o.HORIZONTAL),void 0===u&&(u=0);var s=new n.StandardMaterial("shoulder",e);s.diffuseColor=new n.Color3(.83,.79,.77);var c,d=new n.StandardMaterial("roadBed",e);return d.diffuseColor=new n.Color3(.43,.42,.44),[o.HORIZONTAL,o.VERTICAL].includes(i)&&(c=function(e,r){var o=r[0],a=r[1],i=n.MeshBuilder.CreateBox("shoulder",{width:1,height:.02,depth:.1},e);i.material=o;var u=i.clone(),s=n.MeshBuilder.CreatePlane("roadBed",{width:1,size:.8},e);s.material=a,i.position=new n.Vector3(0,.01,-.45),u.position=new n.Vector3(0,.01,.45),s.position=new n.Vector3(0,.001,0),s.rotation=new n.Vector3(Math.PI/2,0,0);var c=n.Mesh.MergeMeshes([i,u,s],!0,!0,void 0,!1,!0);return c.name=t.ROAD_NAME,c}(e,[s,d]),i===o.VERTICAL&&(c.rotation.y=Math.PI/2)),o.CONNER===i&&(c=function(e,r){var o=r[0],a=r[1],i=n.MeshBuilder.CreateBox("shoulder",{width:1,height:.02,depth:.1},e);i.material=o;var u=n.MeshBuilder.CreateBox("shoulderConner",{width:.1,height:.02,depth:.1},e);u.material=o;var s=n.MeshBuilder.CreatePlane("roadBed",{width:.9,height:.9},e);s.material=a,i.position=new n.Vector3(0,.01,-.45);var c=i.clone();c.rotation.y=Math.PI/2,c.position=new n.Vector3(-.45,.01,0),u.position=new n.Vector3(.45,.01,.45),s.position=new n.Vector3(.05,.001,.05),s.rotation.x=Math.PI/2;var d=n.Mesh.MergeMeshes([i,c,s,u],!0,!0,void 0,!1,!0);return d.name=t.ROAD_NAME,d}(e,[s,d])),o.T_INTERSECTION===i&&(c=function(e,r){var o=r[0],a=r[1],i=n.MeshBuilder.CreateBox("shoulder",{width:1,height:.02,depth:.1},e),u=n.MeshBuilder.CreateBox("shoulderConnerLeft",{width:.1,height:.02,depth:.1},e);i.material=o,u.material=o;var s=u.clone(),c=n.MeshBuilder.CreatePlane("roadBed",{width:1,height:.9},e);c.material=a,i.position=new n.Vector3(0,.01,-.45),u.position=new n.Vector3(.45,.01,.45),s.position=new n.Vector3(-.45,.01,.45),c.position=new n.Vector3(0,.001,.05),c.rotation.x=Math.PI/2;var d=n.Mesh.MergeMeshes([i,u,s,c],!0,!0,void 0,!1,!0);return d.name=t.ROAD_NAME,d}(e,[s,d])),o.CROSSROAD===i&&(c=function(e,r){var o=r[0],a=r[1],i=n.MeshBuilder.CreateBox("shoulderConner",{width:.1,height:.02,depth:.1},e);i.material=o;var u=i.clone(),s=i.clone(),c=i.clone(),d=n.MeshBuilder.CreatePlane("roadBed",{width:1,height:1},e);d.material=a,i.position=new n.Vector3(.45,.01,.45),u.position=new n.Vector3(-.45,.01,.45),s.position=new n.Vector3(.45,.01,-.45),c.position=new n.Vector3(-.45,.01,-.45),d.position.y=.001,d.rotation.x=Math.PI/2;var l=n.Mesh.MergeMeshes([d,i,u,s,c],!0,!0,void 0,!1,!0);return l.name=t.ROAD_NAME,l}(e,[s,d])),u&&(c.rotation.y=u),c.position=new n.Vector3(r,0,a),c}}]);