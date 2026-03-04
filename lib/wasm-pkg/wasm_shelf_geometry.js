/* @ts-self-types="./wasm_shelf_geometry.d.ts" */

import * as wasm from "./wasm_shelf_geometry_bg.wasm";
import { __wbg_set_wasm } from "./wasm_shelf_geometry_bg.js";
__wbg_set_wasm(wasm);

export {
    compute_derived_params, generate_corner_mesh_data, generate_flat_mesh_data, generate_svg_projection
} from "./wasm_shelf_geometry_bg.js";
