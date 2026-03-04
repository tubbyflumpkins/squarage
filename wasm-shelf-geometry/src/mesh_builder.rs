use crate::types::{Vec3, PieceMeshData, ShelfPiece, ColumnPiece, CornerShelfPiece, CornerColumnPiece};

type V3 = [f32; 3];

// UV scale: 1 repeat per 22 inches
const S: f32 = 1.0 / 22.0;

// Golden ratio for UV offset anti-tiling
const PHI: f64 = 0.618_033_988_7;

// UV projection functions
fn uv_shelf_flat(v: &V3) -> [f32; 2] { [v[0] * S, v[2] * S] }
fn uv_shelf_wall(v: &V3) -> [f32; 2] { [v[0] * S, v[1] * S] }
fn uv_shelf_side(v: &V3) -> [f32; 2] { [v[2] * S, v[1] * S] }
fn uv_col_flat(v: &V3) -> [f32; 2] { [v[1] * S, v[2] * S] }
fn uv_col_wall(v: &V3) -> [f32; 2] { [v[1] * S, v[0] * S] }
fn uv_col_cap(v: &V3) -> [f32; 2] { [v[0] * S, v[2] * S] }
fn uv_corner_flat(v: &V3) -> [f32; 2] { [v[0] * S, v[2] * S] }
fn uv_corner_wall(v: &V3) -> [f32; 2] { [(v[0] + v[2]) * S, v[1] * S] }
fn uv_corner_side(v: &V3) -> [f32; 2] { [v[2] * S, v[1] * S] }

fn add_strip(
    pos: &mut Vec<f32>,
    uvs: &mut Vec<f32>,
    edge1: &[V3],
    edge2: &[V3],
    uv_fn: fn(&V3) -> [f32; 2],
) {
    let n = edge1.len();
    for i in 0..n - 1 {
        // Triangle 1
        pos.extend_from_slice(&edge1[i]);
        pos.extend_from_slice(&edge2[i]);
        pos.extend_from_slice(&edge1[i + 1]);
        let uv = uv_fn(&edge1[i]); uvs.extend_from_slice(&uv);
        let uv = uv_fn(&edge2[i]); uvs.extend_from_slice(&uv);
        let uv = uv_fn(&edge1[i + 1]); uvs.extend_from_slice(&uv);

        // Triangle 2
        pos.extend_from_slice(&edge1[i + 1]);
        pos.extend_from_slice(&edge2[i]);
        pos.extend_from_slice(&edge2[i + 1]);
        let uv = uv_fn(&edge1[i + 1]); uvs.extend_from_slice(&uv);
        let uv = uv_fn(&edge2[i]); uvs.extend_from_slice(&uv);
        let uv = uv_fn(&edge2[i + 1]); uvs.extend_from_slice(&uv);
    }
}

fn add_quad(
    pos: &mut Vec<f32>,
    uvs: &mut Vec<f32>,
    a: &V3, b: &V3, c: &V3, d: &V3,
    uv_fn: fn(&V3) -> [f32; 2],
) {
    pos.extend_from_slice(a);
    pos.extend_from_slice(b);
    pos.extend_from_slice(c);
    let uv_a = uv_fn(a); uvs.extend_from_slice(&uv_a);
    let uv_b = uv_fn(b); uvs.extend_from_slice(&uv_b);
    let uv_c = uv_fn(c); uvs.extend_from_slice(&uv_c);

    pos.extend_from_slice(c);
    pos.extend_from_slice(b);
    pos.extend_from_slice(d);
    let uv_c = uv_fn(c); uvs.extend_from_slice(&uv_c);
    let uv_b = uv_fn(b); uvs.extend_from_slice(&uv_b);
    let uv_d = uv_fn(d); uvs.extend_from_slice(&uv_d);
}

/// Apply golden-ratio UV offset to break tiling patterns
fn offset_uvs(uvs: &mut [f32], index: usize) {
    let off_u = ((index as f64 * PHI) % 1.0) as f32;
    let off_v = ((index as f64 * PHI * 1.7) % 1.0) as f32;
    let mut i = 0;
    while i < uvs.len() {
        uvs[i] += off_u;
        uvs[i + 1] += off_v;
        i += 2;
    }
}

/// Convert shelf-space Vec3 to Three.js Y-up V3, centered
#[inline]
fn to_threejs(p: Vec3, cx: f64, cy: f64, cz: f64) -> V3 {
    [(p.x - cx) as f32, (p.z - cz) as f32, (p.y - cy) as f32]
}

// ---------------------------------------------------------------------------
// Flat shelf mesh
// ---------------------------------------------------------------------------

pub fn build_flat_shelf_mesh(
    piece: &ShelfPiece,
    thickness: f64,
    width: f64,
    height: f64,
    depth: f64,
    index: usize,
) -> PieceMeshData {
    let cx = width / 2.0;
    let cy = depth / 2.0;
    let cz = height / 2.0;
    let ht = thickness / 2.0;
    let n = piece.front_edge.len();

    let mut top_f = Vec::with_capacity(n);
    let mut top_b = Vec::with_capacity(n);
    let mut bot_f = Vec::with_capacity(n);
    let mut bot_b = Vec::with_capacity(n);

    for i in 0..n {
        let f = piece.front_edge[i];
        let b = piece.back_edge[i];
        top_f.push([(f.x - cx) as f32, (f.z + ht - cz) as f32, (f.y - cy) as f32]);
        top_b.push([(b.x - cx) as f32, (b.z + ht - cz) as f32, (b.y - cy) as f32]);
        bot_f.push([(f.x - cx) as f32, (f.z - ht - cz) as f32, (f.y - cy) as f32]);
        bot_b.push([(b.x - cx) as f32, (b.z - ht - cz) as f32, (b.y - cy) as f32]);
    }

    let mut pos = Vec::new();
    let mut uvs = Vec::new();

    add_strip(&mut pos, &mut uvs, &top_b, &top_f, uv_shelf_flat);
    add_strip(&mut pos, &mut uvs, &bot_f, &bot_b, uv_shelf_flat);
    add_strip(&mut pos, &mut uvs, &top_f, &bot_f, uv_shelf_wall);
    add_strip(&mut pos, &mut uvs, &bot_b, &top_b, uv_shelf_wall);
    add_quad(&mut pos, &mut uvs, &top_b[0], &top_f[0], &bot_b[0], &bot_f[0], uv_shelf_side);
    add_quad(&mut pos, &mut uvs, &top_f[n - 1], &top_b[n - 1], &bot_f[n - 1], &bot_b[n - 1], uv_shelf_side);

    offset_uvs(&mut uvs, index);

    PieceMeshData { positions: pos, uvs }
}

// ---------------------------------------------------------------------------
// Flat column mesh
// ---------------------------------------------------------------------------

pub fn build_flat_column_mesh(
    piece: &ColumnPiece,
    thickness: f64,
    width: f64,
    height: f64,
    depth: f64,
    index: usize,
) -> PieceMeshData {
    let cx = width / 2.0;
    let cy = depth / 2.0;
    let cz = height / 2.0;
    let ht = thickness / 2.0;
    let n = piece.front_edge.len();

    let mut r_f = Vec::with_capacity(n);
    let mut r_b = Vec::with_capacity(n);
    let mut l_f = Vec::with_capacity(n);
    let mut l_b = Vec::with_capacity(n);

    for i in 0..n {
        let f = piece.front_edge[i];
        let b = piece.back_edge[i];
        r_f.push([(f.x + ht - cx) as f32, (f.z - cz) as f32, (f.y - cy) as f32]);
        r_b.push([(b.x + ht - cx) as f32, (b.z - cz) as f32, (b.y - cy) as f32]);
        l_f.push([(f.x - ht - cx) as f32, (f.z - cz) as f32, (f.y - cy) as f32]);
        l_b.push([(b.x - ht - cx) as f32, (b.z - cz) as f32, (b.y - cy) as f32]);
    }

    let mut pos = Vec::new();
    let mut uvs = Vec::new();

    add_strip(&mut pos, &mut uvs, &r_b, &r_f, uv_col_flat);
    add_strip(&mut pos, &mut uvs, &l_f, &l_b, uv_col_flat);
    add_strip(&mut pos, &mut uvs, &r_f, &l_f, uv_col_wall);
    add_strip(&mut pos, &mut uvs, &l_b, &r_b, uv_col_wall);
    add_quad(&mut pos, &mut uvs, &r_f[n - 1], &r_b[n - 1], &l_f[n - 1], &l_b[n - 1], uv_col_cap);
    add_quad(&mut pos, &mut uvs, &l_f[0], &l_b[0], &r_f[0], &r_b[0], uv_col_cap);

    offset_uvs(&mut uvs, index);

    PieceMeshData { positions: pos, uvs }
}

// ---------------------------------------------------------------------------
// Corner shelf mesh (L-shaped slab)
// ---------------------------------------------------------------------------

pub fn build_corner_shelf_mesh(
    piece: &CornerShelfPiece,
    thickness: f64,
    width: f64,
    length: f64,
    height: f64,
    index: usize,
) -> PieceMeshData {
    let cx = width / 2.0;
    let cy = length / 2.0;
    let cz = height / 2.0;
    let ht = thickness / 2.0;
    let n = piece.front_edge.len();
    let z = piece.front_edge[0].z;

    // Back edge traces the full L-wall: (width,0) → (0,0) → (0,length)
    let total_back = width + length;
    let mut back_pts = Vec::with_capacity(n);
    for i in 0..n {
        let t = (i as f64 / (n - 1) as f64) * total_back;
        if t <= width {
            back_pts.push(Vec3 { x: width - t, y: 0.0, z });
        } else {
            back_pts.push(Vec3 { x: 0.0, y: t - width, z });
        }
    }

    let mut top_f = Vec::with_capacity(n);
    let mut top_bk = Vec::with_capacity(n);
    let mut bot_f = Vec::with_capacity(n);
    let mut bot_bk = Vec::with_capacity(n);

    for i in 0..n {
        let f = piece.front_edge[i];
        let b = back_pts[i];
        top_f.push(to_threejs(Vec3 { x: f.x, y: f.y, z: f.z + ht }, cx, cy, cz));
        top_bk.push(to_threejs(Vec3 { x: b.x, y: b.y, z: b.z + ht }, cx, cy, cz));
        bot_f.push(to_threejs(Vec3 { x: f.x, y: f.y, z: f.z - ht }, cx, cy, cz));
        bot_bk.push(to_threejs(Vec3 { x: b.x, y: b.y, z: b.z - ht }, cx, cy, cz));
    }

    let mut pos = Vec::new();
    let mut uvs = Vec::new();

    add_strip(&mut pos, &mut uvs, &top_bk, &top_f, uv_corner_flat);
    add_strip(&mut pos, &mut uvs, &bot_f, &bot_bk, uv_corner_flat);
    add_strip(&mut pos, &mut uvs, &top_f, &bot_f, uv_corner_wall);
    add_strip(&mut pos, &mut uvs, &bot_bk, &top_bk, uv_corner_wall);
    add_quad(&mut pos, &mut uvs, &top_bk[0], &top_f[0], &bot_bk[0], &bot_f[0], uv_corner_side);
    add_quad(&mut pos, &mut uvs, &top_f[n - 1], &top_bk[n - 1], &bot_f[n - 1], &bot_bk[n - 1], uv_corner_side);

    offset_uvs(&mut uvs, index);

    PieceMeshData { positions: pos, uvs }
}

// ---------------------------------------------------------------------------
// Corner column mesh (perpendicular to slice angle)
// ---------------------------------------------------------------------------

pub fn build_corner_column_mesh(
    piece: &CornerColumnPiece,
    thickness: f64,
    width: f64,
    length: f64,
    height: f64,
    angle_rad: f64,
    index: usize,
) -> PieceMeshData {
    let cx = width / 2.0;
    let cy = length / 2.0;
    let cz = height / 2.0;
    let ht = thickness / 2.0;
    let n = piece.front_edge.len();

    // Perpendicular to slice
    let perp_x = angle_rad.sin();
    let perp_y = -angle_rad.cos();
    let dx = ht * perp_x;
    let dy = ht * perp_y;

    let mut r_f = Vec::with_capacity(n);
    let mut r_b = Vec::with_capacity(n);
    let mut l_f = Vec::with_capacity(n);
    let mut l_b = Vec::with_capacity(n);

    for i in 0..n {
        let f = piece.front_edge[i];
        let b = piece.back_edge[i];
        r_f.push([(f.x + dx - cx) as f32, (f.z - cz) as f32, (f.y + dy - cy) as f32]);
        r_b.push([(b.x + dx - cx) as f32, (b.z - cz) as f32, (b.y + dy - cy) as f32]);
        l_f.push([(f.x - dx - cx) as f32, (f.z - cz) as f32, (f.y - dy - cy) as f32]);
        l_b.push([(b.x - dx - cx) as f32, (b.z - cz) as f32, (b.y - dy - cy) as f32]);
    }

    let mut pos = Vec::new();
    let mut uvs = Vec::new();

    add_strip(&mut pos, &mut uvs, &r_b, &r_f, uv_col_flat);
    add_strip(&mut pos, &mut uvs, &l_f, &l_b, uv_col_flat);
    add_strip(&mut pos, &mut uvs, &r_f, &l_f, uv_col_wall);
    add_strip(&mut pos, &mut uvs, &l_b, &r_b, uv_col_wall);
    add_quad(&mut pos, &mut uvs, &r_f[n - 1], &r_b[n - 1], &l_f[n - 1], &l_b[n - 1], uv_col_cap);
    add_quad(&mut pos, &mut uvs, &l_f[0], &l_b[0], &r_f[0], &r_b[0], uv_col_cap);

    offset_uvs(&mut uvs, index);

    PieceMeshData { positions: pos, uvs }
}
