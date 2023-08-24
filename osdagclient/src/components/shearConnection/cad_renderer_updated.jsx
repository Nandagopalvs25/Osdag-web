/* This is an updated version of the CAD renderer which works with multiple tabs.
 * This renderer can also show different sections of the model, and different colours.
*/
// Author - Aaranyak Ghosh
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { Select } from 'antd';
import { OrbitControls, useTexture} from '@react-three/drei'
import { useLoader } from '@react-three/fiber';
import React, {useMemo, useState} from "react";
import cad_background from '../../assets/cad_empty_image.png'
import { Canvas } from '@react-three/fiber'
import { Euler } from 'three';
const BASE_URL = 'http://127.0.0.1:8000/';

//import mdl from  
var plate_data = undefined;
var beam_data = undefined;
var column_data = undefined;

const empty_image_background = (
    <div style={{ maxwidth: '740px', height: '600px', border: '1px solid black' }}>
      {<img src={cad_background} alt="Demo" height='100%' width='100%' />}
    </div>
) /* When CAD does not render */

function CadModelViewport(properties) {
    /* Returns a CAD model viewport to place objects in */
    return ( /* Source - FinePlate.jsx */
        <div style={{ maxwidth: '740px', height: '600px', border: '1px solid black', backgroundImage: `url(${cad_background})` }}>
            <Canvas gl={{ antialias: true }} camera={{ aspect: 1, fov: 1500, position: [10, 10, 10] }} >
                <group name='scene'>
                    <axesHelper args={[200]}/>
                    {properties.children}
                    <OrbitControls />
                </group>                
            </Canvas>
        </div> 
    );
}

function RenderCadModel(properties) {
    /* Renders the model and creats the viewport */
    if (properties.render_boolean) {
        let rotation = new Euler(Math.PI / -2,0,0);
        if (properties.type == "Column Web-Beam-Web") rotation = new Euler(0,Math.PI / -2,0); /* No rotation for this type */
        else if (properties.type == "Beam-Beam") rotation = new Euler(Math.PI / 2,0,0); /* No rotation for Beam-Beam */
        if (plate_data  && beam_data && column_data ) { /* If none of them fail */ 
            var plate_3d = load_three_mesh(plate_data, "#a89732", 0.01, rotation); /* Create a mesh object for the plate */
            var column_3d = load_three_mesh(column_data, "#32a840", 0.01, rotation); /* Ditto for column */
            var beam_3d = load_three_mesh(beam_data, "#3268a8", 0.01, rotation); /* Ditto for beam */

            return ( /* What to put in the viewport */
                <div>
                    <CadModelViewport>
                        {plate_3d}
                        {beam_3d}
                        {column_3d}
                    </CadModelViewport>
                </div>
            )
        }
        else { /* If any of the requests fail */
            return empty_image_background;
        }
    }
    else {
        return empty_image_background;
    }
}

async function init_cad_data() {
    /* Download all CAD models */
    plate_data = await load_cad_model('Plate');
    column_data = await load_cad_model('Column');
    beam_data = await load_cad_model('Beam');
}

async function load_cad_model(section) {
    /* Loads the CAD model, and it on a view section */
    var response = await fetch(`${BASE_URL}design/cad?section=${section}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
    }); /* Get the cad model data */
    var cad_data = undefined;
    if (response.status == 201) { /* If CAD model successfully generated */    
        cad_data = await response.text();/* Get OBJ data in string format */
    }
    return cad_data;
}

function object_to_mesh(obj) {
    /* This Code is not written by me*/
    /* Source - threerender.jsx */
    const geometry = useMemo(() => {
        let g;
        obj.traverse((c) => {
          if (c.type === "Mesh") {
            const _c = c ; 
            g = _c.geometry;
          }
        });
        //console.log("Done Loading")
        return g;
      }, [obj]);
    return geometry;
}

function load_three_mesh(data, colour, scale, rotation) {
    /* Converts the obj into a three.js geometry file */
    const loader = new OBJLoader();
    let object = loader.parse(data); /* Parse the string-based OBJ file into an actual object */
    let geometry = object_to_mesh(object); /* Convert the three.js object to geometry */
    let mesh_object = ( /* Three.js Mesh object with colour */
        <mesh geometry={geometry} /* Set the mesh geometry */ scale={scale}/* Object Scale */ rotation={rotation}>
            <meshPhysicalMaterial attach = "material" color={colour} metalness={0.25} roughness={0.1} opacity={2.0} transparent = {true} transmission={0.99} clearcoat={1.0} clearcoatRoughness={0.25}/>
        </mesh>
    )

    return mesh_object;
}

export {init_cad_data, load_cad_model, load_three_mesh, RenderCadModel, CadModelViewport, object_to_mesh};