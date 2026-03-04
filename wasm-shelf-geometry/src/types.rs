use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy)]
pub struct Vec2 {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Copy)]
pub struct Vec3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

// Input parameter structs (from JS)

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlatMeshInput {
    pub width: f64,
    pub height: f64,
    pub depth: f64,
    pub shelf_count: u32,
    pub column_count: u32,
    pub round_left: bool,
    pub round_right: bool,
    pub thickness: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CornerMeshInput {
    pub width: f64,
    pub height: f64,
    pub depth: f64,
    pub length: f64,
    pub shelf_count: u32,
    pub column_count: u32,
    pub thickness: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SvgInput {
    pub is_corner: bool,
    pub width: f64,
    pub height: f64,
    pub depth: f64,
    pub length: f64,
    pub shelf_count: u32,
    pub column_count: u32,
    pub round_left: bool,
    pub round_right: bool,
    pub rotation: f64,
    pub tilt: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DerivedParamsInput {
    pub is_corner: bool,
    pub width: f64,
    pub height: f64,
    pub depth: f64,
    pub length: f64,
    pub shelf_count: u32,
    pub column_count: u32,
}

// Output structs (to JS)

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DerivedParams {
    pub amplitude: f64,
    pub shelf_offset: f64,
    pub column_offset: f64,
    pub column_angle: f64,
    pub price: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PieceMeshData {
    pub positions: Vec<f32>,
    pub uvs: Vec<f32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlatMeshResult {
    pub shelves: Vec<PieceMeshData>,
    pub columns: Vec<PieceMeshData>,
    pub derived: DerivedParams,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CornerMeshResult {
    pub shelves: Vec<PieceMeshData>,
    pub columns: Vec<PieceMeshData>,
    pub derived: DerivedParams,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SvgShelfPaths {
    pub front_path: String,
    pub back_path: String,
    pub side_points: Vec<f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SvgCornerShelfPaths {
    pub front_path: String,
    pub back_x_path: String,
    pub back_y_path: String,
    pub width_side: Vec<f64>,
    pub length_side: Vec<f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SvgColumnPaths {
    pub front_path: String,
    pub back_path: String,
    pub side_points: Vec<f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SvgBounds {
    pub min_x: f64,
    pub max_x: f64,
    pub min_y: f64,
    pub max_y: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlatSvgResult {
    pub shelves: Vec<SvgShelfPaths>,
    pub columns: Vec<SvgColumnPaths>,
    pub bounds: SvgBounds,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CornerSvgResult {
    pub shelves: Vec<SvgCornerShelfPaths>,
    pub columns: Vec<SvgColumnPaths>,
    pub bounds: SvgBounds,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type")]
pub enum SvgResult {
    #[serde(rename = "flat")]
    Flat(FlatSvgResult),
    #[serde(rename = "corner")]
    Corner(CornerSvgResult),
}

// Internal geometry structs (not serialized to JS)

pub struct ShelfPiece {
    pub front_edge: Vec<Vec3>,
    pub back_edge: Vec<Vec3>,
    pub left_side: [Vec3; 2],
    pub right_side: [Vec3; 2],
}

pub struct ColumnPiece {
    pub front_edge: Vec<Vec3>,
    pub back_edge: Vec<Vec3>,
    pub top_side: [Vec3; 2],
    pub bottom_side: [Vec3; 2],
}

pub struct ShelfGeometry {
    pub shelves: Vec<ShelfPiece>,
    pub columns: Vec<ColumnPiece>,
}

pub struct CornerShelfPiece {
    pub front_edge: Vec<Vec3>,
    pub back_edge_x: Vec<Vec3>,
    pub back_edge_y: Vec<Vec3>,
    pub width_side: [Vec3; 2],
    pub length_side: [Vec3; 2],
}

pub struct CornerColumnPiece {
    pub front_edge: Vec<Vec3>,
    pub back_edge: Vec<Vec3>,
    pub top_side: [Vec3; 2],
    pub bottom_side: [Vec3; 2],
}

pub struct CornerShelfGeometry {
    pub shelves: Vec<CornerShelfPiece>,
    pub columns: Vec<CornerColumnPiece>,
}
