mod types;
mod catmull_rom;
mod derived_params;
mod flat;
mod corner;
mod mesh_builder;
mod projection;

use wasm_bindgen::prelude::*;
use types::*;

#[wasm_bindgen]
pub fn generate_flat_mesh_data(input: JsValue) -> Result<JsValue, JsValue> {
    let params: FlatMeshInput = serde_wasm_bindgen::from_value(input)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let derived = derived_params::compute_all(
        false,
        params.width,
        params.height,
        params.depth,
        0.0, // length not used for flat
        params.shelf_count,
        params.column_count,
    );

    let geo = flat::generate_shelf_geometry(
        params.width,
        params.height,
        params.depth,
        derived.amplitude,
        params.shelf_count,
        params.column_count,
        derived.shelf_offset,
        derived.column_offset,
        params.round_left,
        params.round_right,
    );

    let shelf_count = geo.shelves.len();
    let shelves: Vec<PieceMeshData> = geo.shelves.iter().enumerate().map(|(i, piece)| {
        mesh_builder::build_flat_shelf_mesh(piece, params.thickness, params.width, params.height, params.depth, i)
    }).collect();

    let columns: Vec<PieceMeshData> = geo.columns.iter().enumerate().map(|(i, piece)| {
        mesh_builder::build_flat_column_mesh(piece, params.thickness, params.width, params.height, params.depth, i + shelf_count)
    }).collect();

    let result = FlatMeshResult { shelves, columns, derived };
    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn generate_corner_mesh_data(input: JsValue) -> Result<JsValue, JsValue> {
    let params: CornerMeshInput = serde_wasm_bindgen::from_value(input)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let derived = derived_params::compute_all(
        true,
        params.width,
        params.height,
        params.depth,
        params.length,
        params.shelf_count,
        params.column_count,
    );

    let geo = corner::generate_corner_shelf_geometry(
        params.width,
        params.height,
        params.depth,
        params.length,
        derived.amplitude,
        params.shelf_count,
        params.column_count,
        derived.shelf_offset,
        derived.column_offset,
        derived.column_angle,
    );

    let clamped_angle = derived.column_angle.clamp(0.01, 89.99);
    let angle_rad = clamped_angle.to_radians();

    let shelf_count = geo.shelves.len();
    let shelves: Vec<PieceMeshData> = geo.shelves.iter().enumerate().map(|(i, piece)| {
        mesh_builder::build_corner_shelf_mesh(piece, params.thickness, params.width, params.length, params.height, i)
    }).collect();

    let columns: Vec<PieceMeshData> = geo.columns.iter().enumerate().map(|(i, piece)| {
        mesh_builder::build_corner_column_mesh(piece, params.thickness, params.width, params.length, params.height, angle_rad, i + shelf_count)
    }).collect();

    let result = CornerMeshResult { shelves, columns, derived };
    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn generate_svg_projection(input: JsValue) -> Result<JsValue, JsValue> {
    let params: SvgInput = serde_wasm_bindgen::from_value(input)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let derived = derived_params::compute_all(
        params.is_corner,
        params.width,
        params.height,
        params.depth,
        params.length,
        params.shelf_count,
        params.column_count,
    );

    let result = if params.is_corner {
        let geo = corner::generate_corner_shelf_geometry(
            params.width,
            params.height,
            params.depth,
            params.length,
            derived.amplitude,
            params.shelf_count,
            params.column_count,
            derived.shelf_offset,
            derived.column_offset,
            derived.column_angle,
        );
        let svg = projection::project_corner_geometry(&geo, params.rotation, params.width, params.length, params.tilt);
        SvgResult::Corner(svg)
    } else {
        let geo = flat::generate_shelf_geometry(
            params.width,
            params.height,
            params.depth,
            derived.amplitude,
            params.shelf_count,
            params.column_count,
            derived.shelf_offset,
            derived.column_offset,
            params.round_left,
            params.round_right,
        );
        let svg = projection::project_flat_geometry(&geo, params.rotation, params.width, params.depth, params.tilt);
        SvgResult::Flat(svg)
    };

    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn compute_derived_params(input: JsValue) -> Result<JsValue, JsValue> {
    let params: DerivedParamsInput = serde_wasm_bindgen::from_value(input)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let result = derived_params::compute_all(
        params.is_corner,
        params.width,
        params.height,
        params.depth,
        params.length,
        params.shelf_count,
        params.column_count,
    );

    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}
