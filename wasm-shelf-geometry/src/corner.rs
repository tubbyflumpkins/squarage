use crate::catmull_rom::centripetal_interpolate_5;
use crate::types::{Vec2, Vec3, CornerShelfPiece, CornerColumnPiece, CornerShelfGeometry};

const MIN: f64 = 0.0001;
const DIAG: f64 = std::f64::consts::FRAC_1_SQRT_2; // 1/√2

/// Cosine interpolation for C1 continuity at segment boundaries.
fn smooth_lerp(a: f64, b: f64, t: f64) -> f64 {
    let s = (1.0 - (std::f64::consts::PI * t).cos()) / 2.0;
    a + (b - a) * s
}

/// Distance between two 2D points.
fn dist(a: Vec2, b: Vec2) -> f64 {
    ((a.x - b.x).powi(2) + (a.y - b.y).powi(2)).sqrt()
}

const ALPHA: f64 = 0.5;

/// Loft-based surface evaluator — sine offsets baked into control points.
/// Used for shelves and surface contours (no near-wall pinch).
pub fn get_corner_front_surface_loft(
    u: f64,
    z: f64,
    width: f64,
    length: f64,
    depth: f64,
    height: f64,
    amplitude: f64,
) -> Vec2 {
    let sine_value = (z / height * std::f64::consts::PI * 2.0).sin();
    let wave = amplitude * sine_value;

    let points: [Vec2; 5] = [
        Vec2 { x: width, y: 0.0 },
        Vec2 { x: width - 3.0 * depth / 8.0, y: 3.0 * depth / 4.0 + wave },
        Vec2 { x: 5.0 * depth / 4.0 - wave * DIAG, y: 5.0 * depth / 4.0 - wave * DIAG },
        Vec2 { x: 3.0 * depth / 4.0 + wave, y: length - 3.0 * depth / 8.0 },
        Vec2 { x: 0.0, y: length },
    ];

    centripetal_interpolate_5(&points, u)
}

/// Normal-based surface evaluator — for columns.
/// Evaluates base path (no wave), computes outward normal from tangent,
/// interpolates amplitude [0, +A, -A, +A, 0] via smoothLerp with wingWeight=1.5.
/// Returns basePos + interpAmplitude * sin(2πz/h) * normal.
pub fn get_corner_front_surface(
    u: f64,
    z: f64,
    width: f64,
    length: f64,
    depth: f64,
    height: f64,
    amplitude: f64,
) -> Vec2 {
    let wing_weight: f64 = 1.5;

    // 5 base positions at zero amplitude
    let bases: [Vec2; 5] = [
        Vec2 { x: width, y: 0.0 },
        Vec2 { x: width - 3.0 * depth / 8.0, y: 3.0 * depth / 4.0 },
        Vec2 { x: 5.0 * depth / 4.0, y: 5.0 * depth / 4.0 },
        Vec2 { x: 3.0 * depth / 4.0, y: length - 3.0 * depth / 8.0 },
        Vec2 { x: 0.0, y: length },
    ];

    // Centripetal knots from base positions
    let mut raw = [0.0_f64; 5];
    for i in 1..5 {
        raw[i] = raw[i - 1] + dist(bases[i], bases[i - 1]).powf(ALPHA);
    }
    let total = raw[4];
    if total < 1e-10 {
        return bases[2];
    }
    let k: [f64; 5] = [
        raw[0] / total,
        raw[1] / total,
        raw[2] / total,
        raw[3] / total,
        raw[4] / total,
    ];

    // Ghost points for perpendicular wall arrival
    let d01 = dist(bases[0], bases[1]).max(1.0);
    let ghost_base0 = Vec2 { x: bases[0].x, y: bases[0].y - d01 };
    let k_before = k[0] - dist(ghost_base0, bases[0]).powf(ALPHA) / total;

    let d34 = dist(bases[3], bases[4]).max(1.0);
    let ghost_base4 = Vec2 { x: bases[4].x - d34, y: bases[4].y };
    let k_after = k[4] + dist(bases[4], ghost_base4).powf(ALPHA) / total;

    let t = u.clamp(0.0, 1.0);

    // Helper closure to evaluate base path at parameter t
    let eval_base = |t: f64| -> Vec2 {
        if t <= k[1] {
            crate::catmull_rom::barry_goldman(ghost_base0, bases[0], bases[1], bases[2], k_before, k[0], k[1], k[2], t)
        } else if t <= k[2] {
            crate::catmull_rom::barry_goldman(bases[0], bases[1], bases[2], bases[3], k[0], k[1], k[2], k[3], t)
        } else if t <= k[3] {
            crate::catmull_rom::barry_goldman(bases[1], bases[2], bases[3], bases[4], k[1], k[2], k[3], k[4], t)
        } else {
            crate::catmull_rom::barry_goldman(bases[2], bases[3], bases[4], ghost_base4, k[2], k[3], k[4], k_after, t)
        }
    };

    // Step 1: Evaluate baseXY(u)
    let base_pos = eval_base(t);

    // Step 2: Compute outward normal from base path tangent
    let eps = 0.001;
    let t_a = (t - eps).max(0.0);
    let t_b = (t + eps).min(1.0);
    let pos_a = eval_base(t_a);
    let pos_b = eval_base(t_b);

    let tx = pos_b.x - pos_a.x;
    let ty = pos_b.y - pos_a.y;
    let mut nx = -ty;
    let mut ny = tx;

    let len = (nx * nx + ny * ny).sqrt();
    if len > 1e-10 {
        nx /= len;
        ny /= len;
    }

    // Ensure outward (away from origin/corner)
    if nx + ny < 0.0 {
        nx = -nx;
        ny = -ny;
    }

    // Step 3: Interpolate amplitude
    let amp_values = [0.0, amplitude, -amplitude, amplitude, 0.0];
    let interp_amplitude = if t <= k[0] {
        amp_values[0]
    } else if t <= k[1] {
        let seg = (t - k[0]) / (k[1] - k[0]);
        smooth_lerp(amp_values[0], amp_values[1], seg)
    } else if t <= k[2] {
        let seg = (t - k[1]) / (k[2] - k[1]);
        smooth_lerp(amp_values[1], amp_values[2], seg.powf(wing_weight))
    } else if t <= k[3] {
        let seg = (t - k[2]) / (k[3] - k[2]);
        smooth_lerp(amp_values[2], amp_values[3], 1.0 - (1.0 - seg).powf(wing_weight))
    } else if t <= k[4] {
        let seg = (t - k[3]) / (k[4] - k[3]);
        smooth_lerp(amp_values[3], amp_values[4], seg)
    } else {
        amp_values[4]
    };

    // Step 4: Combine
    let sine_value = (z / height * std::f64::consts::PI * 2.0).sin();

    Vec2 {
        x: base_pos.x + interp_amplitude * sine_value * nx,
        y: base_pos.y + interp_amplitude * sine_value * ny,
    }
}

/// Get back point for column slice — line-rectangle intersection.
pub fn get_back_point_for_slice(k: f64, angle_rad: f64, width: f64, length: f64) -> Vec2 {
    let sin_a = angle_rad.sin();
    let cos_a = angle_rad.cos();

    if sin_a > 1e-10 {
        let x = k / sin_a;
        if x >= -1e-10 && x <= width + 1e-10 {
            return Vec2 { x: x.clamp(0.0, width), y: 0.0 };
        }
    }

    if cos_a > 1e-10 {
        let y = -k / cos_a;
        if y >= -1e-10 && y <= length + 1e-10 {
            return Vec2 { x: 0.0, y: y.clamp(0.0, length) };
        }
    }

    if k >= 0.0 {
        Vec2 { x: (if sin_a > 1e-10 { k / sin_a } else { width }).min(width), y: 0.0 }
    } else {
        Vec2 { x: 0.0, y: (if cos_a > 1e-10 { -k / cos_a } else { length }).min(length) }
    }
}

/// Generate the full corner shelf geometry (shelves + columns).
pub fn generate_corner_shelf_geometry(
    width: f64,
    height: f64,
    depth: f64,
    length: f64,
    amplitude: f64,
    shelf_count: u32,
    column_count: u32,
    shelf_offset: f64,
    column_offset: f64,
    column_angle: f64,
) -> CornerShelfGeometry {
    let width = width.max(MIN);
    let length = length.max(MIN);
    let height = height.max(MIN);
    let depth = depth.max(MIN);

    let mut shelves = Vec::with_capacity(shelf_count as usize);
    let shelf_start_z = shelf_offset;
    let shelf_end_z = height - shelf_offset;

    for i in 0..shelf_count {
        let t_z = if shelf_count > 1 {
            i as f64 / (shelf_count - 1) as f64
        } else {
            0.5
        };
        let z = shelf_start_z + t_z * (shelf_end_z - shelf_start_z);

        let segments = 80;
        let mut front_edge = Vec::with_capacity(segments + 1);
        for j in 0..=segments {
            let t = j as f64 / segments as f64;
            let pos = get_corner_front_surface_loft(t, z, width, length, depth, height, amplitude);
            front_edge.push(Vec3 { x: pos.x, y: pos.y, z });
        }

        let mut back_edge_x = Vec::with_capacity(21);
        for j in 0..=20 {
            back_edge_x.push(Vec3 { x: width * (1.0 - j as f64 / 20.0), y: 0.0, z });
        }

        let mut back_edge_y = Vec::with_capacity(21);
        for j in 0..=20 {
            back_edge_y.push(Vec3 { x: 0.0, y: length * (j as f64 / 20.0), z });
        }

        let width_side = [
            front_edge[0],
            Vec3 { x: width, y: 0.0, z },
        ];
        let length_side = [
            *front_edge.last().unwrap(),
            Vec3 { x: 0.0, y: length, z },
        ];

        shelves.push(CornerShelfPiece { front_edge, back_edge_x, back_edge_y, width_side, length_side });
    }

    // Columns — use normal-based evaluator
    let mut columns = Vec::with_capacity(column_count as usize);
    let clamped_angle = column_angle.clamp(0.01, 89.99);
    let angle_rad = clamped_angle.to_radians();
    let sin_a = angle_rad.sin();
    let cos_a = angle_rad.cos();

    let sample_z = height / 2.0;
    let start_pos = get_corner_front_surface(0.0, sample_z, width, length, depth, height, amplitude);
    let end_pos = get_corner_front_surface(1.0, sample_z, width, length, depth, height, amplitude);
    let k_start = start_pos.x * sin_a - start_pos.y * cos_a;
    let k_end = end_pos.x * sin_a - end_pos.y * cos_a;
    let k_min = k_start.min(k_end) + column_offset;
    let k_max = k_start.max(k_end) - column_offset;

    for i in 0..column_count {
        let t_col = if column_count > 1 {
            i as f64 / (column_count - 1) as f64
        } else {
            0.5
        };
        let k = k_max + t_col * (k_min - k_max);

        let col_segments = 40;
        let mut front_edge = Vec::with_capacity(col_segments + 1);
        let mut back_edge = Vec::with_capacity(col_segments + 1);

        for j in 0..=col_segments {
            let z = (j as f64 / col_segments as f64) * height;

            let mut t_low = 0.0_f64;
            let mut t_high = 1.0_f64;
            let mut t_mid = 0.5_f64;
            for _ in 0..20 {
                t_mid = (t_low + t_high) / 2.0;
                let pos = get_corner_front_surface(t_mid, z, width, length, depth, height, amplitude);
                if pos.x * sin_a - pos.y * cos_a > k {
                    t_low = t_mid;
                } else {
                    t_high = t_mid;
                }
            }

            let front_pos = get_corner_front_surface(t_mid, z, width, length, depth, height, amplitude);
            front_edge.push(Vec3 { x: front_pos.x, y: front_pos.y, z });

            let back_pos = get_back_point_for_slice(k, angle_rad, width, length);
            back_edge.push(Vec3 { x: back_pos.x, y: back_pos.y, z });
        }

        let bottom_side = [front_edge[0], back_edge[0]];
        let top_side = [*front_edge.last().unwrap(), *back_edge.last().unwrap()];

        columns.push(CornerColumnPiece { front_edge, back_edge, top_side, bottom_side });
    }

    CornerShelfGeometry { shelves, columns }
}
