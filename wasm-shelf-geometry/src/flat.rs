use crate::catmull_rom::centripetal_interpolate_5_flat;
use crate::types::{Vec2, Vec3, ShelfPiece, ColumnPiece, ShelfGeometry};

const MIN: f64 = 0.0001;

/// Evaluate the flat front surface at parameter u (0..1 across width) and height z.
pub fn evaluate_flat_surface(
    u: f64,
    z: f64,
    width: f64,
    height: f64,
    depth: f64,
    amplitude: f64,
    round_left: bool,
    round_right: bool,
) -> Vec2 {
    let t = z / height;
    let sine_value = (t * std::f64::consts::PI * 2.0).sin();

    let points: [Vec2; 5] = [
        Vec2 { x: 0.0,             y: if round_left { 0.0 } else { depth } },
        Vec2 { x: width / 6.0,     y: depth + amplitude * sine_value },
        Vec2 { x: width / 2.0,     y: depth - amplitude * sine_value },
        Vec2 { x: width * 5.0 / 6.0, y: depth + amplitude * sine_value },
        Vec2 { x: width,           y: if round_right { 0.0 } else { depth } },
    ];

    centripetal_interpolate_5_flat(&points, u)
}

/// Generate the full flat shelf geometry (shelves + columns).
pub fn generate_shelf_geometry(
    width: f64,
    height: f64,
    depth: f64,
    amplitude: f64,
    shelf_count: u32,
    column_count: u32,
    shelf_offset: f64,
    column_offset: f64,
    round_left: bool,
    round_right: bool,
) -> ShelfGeometry {
    let width = width.max(MIN);
    let height = height.max(MIN);
    let depth = depth.max(MIN);

    let mut shelves = Vec::with_capacity(shelf_count as usize);

    // Generate horizontal shelf pieces
    let shelf_start_z = shelf_offset;
    let shelf_end_z = height - shelf_offset;

    for i in 0..shelf_count {
        let t = if shelf_count > 1 {
            i as f64 / (shelf_count - 1) as f64
        } else {
            0.5
        };
        let z = shelf_start_z + t * (shelf_end_z - shelf_start_z);

        let edge_segments = 60;
        let mut front_edge = Vec::with_capacity(edge_segments + 1);
        let mut back_edge = Vec::with_capacity(edge_segments + 1);

        for j in 0..=edge_segments {
            let u = j as f64 / edge_segments as f64;
            let pos = evaluate_flat_surface(u, z, width, height, depth, amplitude, round_left, round_right);
            front_edge.push(Vec3 { x: pos.x, y: pos.y, z });
            back_edge.push(Vec3 { x: u * width, y: 0.0, z });
        }

        let left_side = [
            front_edge[0],
            Vec3 { x: 0.0, y: 0.0, z },
        ];
        let right_side = [
            *front_edge.last().unwrap(),
            Vec3 { x: width, y: 0.0, z },
        ];

        shelves.push(ShelfPiece { front_edge, back_edge, left_side, right_side });
    }

    // Generate vertical column pieces (binary search for u at target X)
    let mut columns = Vec::with_capacity(column_count as usize);
    let col_start_x = column_offset;
    let col_end_x = width - column_offset;

    for i in 0..column_count {
        let t = if column_count > 1 {
            i as f64 / (column_count - 1) as f64
        } else {
            0.5
        };
        let x = col_start_x + t * (col_end_x - col_start_x);

        let segments = 40;
        let mut front_edge = Vec::with_capacity(segments + 1);
        let mut back_edge = Vec::with_capacity(segments + 1);

        for j in 0..=segments {
            let z = (j as f64 / segments as f64) * height;

            // Binary search for parameter u where surface X ≈ target x
            let mut u_low = 0.0_f64;
            let mut u_high = 1.0_f64;
            for _ in 0..20 {
                let u_mid = (u_low + u_high) / 2.0;
                let pos = evaluate_flat_surface(u_mid, z, width, height, depth, amplitude, round_left, round_right);
                if pos.x < x {
                    u_low = u_mid;
                } else {
                    u_high = u_mid;
                }
            }

            let front_pos = evaluate_flat_surface((u_low + u_high) / 2.0, z, width, height, depth, amplitude, round_left, round_right);
            front_edge.push(Vec3 { x, y: front_pos.y, z });
            back_edge.push(Vec3 { x, y: 0.0, z });
        }

        let bottom_side = [
            front_edge[0],
            Vec3 { x, y: 0.0, z: 0.0 },
        ];
        let top_side = [
            *front_edge.last().unwrap(),
            Vec3 { x, y: 0.0, z: height },
        ];

        columns.push(ColumnPiece { front_edge, back_edge, top_side, bottom_side });
    }

    ShelfGeometry { shelves, columns }
}
