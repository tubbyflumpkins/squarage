use crate::types::{Vec2, Vec3};

const DEFAULT_TILT: f64 = 30.0;
const ISO_FACTOR: f64 = std::f64::consts::FRAC_1_SQRT_2; // 1/√2

pub fn isometric_project(p: Vec3, tilt_deg: f64) -> Vec2 {
    let tilt_rad = tilt_deg.to_radians();
    let sin_tilt = tilt_rad.sin();
    let cos_tilt = tilt_rad.cos();
    Vec2 {
        x: (p.x - p.y) * ISO_FACTOR,
        y: -p.z * cos_tilt + (p.x + p.y) * ISO_FACTOR * sin_tilt,
    }
}

pub fn rotate_and_project(
    p: Vec3,
    angle: f64,
    center_x: f64,
    center_y: f64,
    tilt_deg: f64,
) -> Vec2 {
    let x = p.x - center_x;
    let y = p.y - center_y;
    let cos_a = angle.cos();
    let sin_a = angle.sin();
    isometric_project(
        Vec3 {
            x: x * cos_a - y * sin_a + center_x,
            y: x * sin_a + y * cos_a + center_y,
            z: p.z,
        },
        tilt_deg,
    )
}

pub fn points_to_path(points: &[Vec2]) -> String {
    if points.is_empty() {
        return String::new();
    }
    let mut path = String::with_capacity(points.len() * 20);
    for (i, p) in points.iter().enumerate() {
        if i == 0 {
            path.push_str(&format!("M {:.2} {:.2}", p.x, p.y));
        } else {
            path.push_str(&format!(" L {:.2} {:.2}", p.x, p.y));
        }
    }
    path
}

pub struct Bounds {
    pub min_x: f64,
    pub max_x: f64,
    pub min_y: f64,
    pub max_y: f64,
}

impl Bounds {
    pub fn new() -> Self {
        Bounds {
            min_x: f64::INFINITY,
            max_x: f64::NEG_INFINITY,
            min_y: f64::INFINITY,
            max_y: f64::NEG_INFINITY,
        }
    }

    pub fn update(&mut self, p: Vec2) {
        self.min_x = self.min_x.min(p.x);
        self.max_x = self.max_x.max(p.x);
        self.min_y = self.min_y.min(p.y);
        self.max_y = self.max_y.max(p.y);
    }
}

// ---------------------------------------------------------------------------
// Project flat shelf geometry with rotation
// ---------------------------------------------------------------------------

use crate::types::{
    ShelfGeometry, CornerShelfGeometry,
    SvgShelfPaths, SvgCornerShelfPaths, SvgColumnPaths, SvgBounds,
    FlatSvgResult, CornerSvgResult,
};

pub fn project_flat_geometry(
    geo: &ShelfGeometry,
    angle: f64,
    width: f64,
    depth: f64,
    tilt_deg: f64,
) -> FlatSvgResult {
    let center_x = width / 2.0;
    let center_y = depth / 2.0;
    let project = |p: Vec3| rotate_and_project(p, angle, center_x, center_y, tilt_deg);

    let mut bounds = Bounds::new();

    let shelves: Vec<SvgShelfPaths> = geo.shelves.iter().map(|s| {
        let front: Vec<Vec2> = s.front_edge.iter().map(|&p| { let pp = project(p); bounds.update(pp); pp }).collect();
        let back: Vec<Vec2> = s.back_edge.iter().map(|&p| { let pp = project(p); bounds.update(pp); pp }).collect();
        let ls0 = project(s.left_side[0]); bounds.update(ls0);
        let ls1 = project(s.left_side[1]); bounds.update(ls1);
        let rs0 = project(s.right_side[0]); bounds.update(rs0);
        let rs1 = project(s.right_side[1]); bounds.update(rs1);
        SvgShelfPaths {
            front_path: points_to_path(&front),
            back_path: points_to_path(&back),
            side_points: vec![ls0.x, ls0.y, ls1.x, ls1.y, rs0.x, rs0.y, rs1.x, rs1.y],
        }
    }).collect();

    let columns: Vec<SvgColumnPaths> = geo.columns.iter().map(|c| {
        let front: Vec<Vec2> = c.front_edge.iter().map(|&p| { let pp = project(p); bounds.update(pp); pp }).collect();
        let back: Vec<Vec2> = c.back_edge.iter().map(|&p| { let pp = project(p); bounds.update(pp); pp }).collect();
        let ts0 = project(c.top_side[0]); bounds.update(ts0);
        let ts1 = project(c.top_side[1]); bounds.update(ts1);
        let bs0 = project(c.bottom_side[0]); bounds.update(bs0);
        let bs1 = project(c.bottom_side[1]); bounds.update(bs1);
        SvgColumnPaths {
            front_path: points_to_path(&front),
            back_path: points_to_path(&back),
            side_points: vec![ts0.x, ts0.y, ts1.x, ts1.y, bs0.x, bs0.y, bs1.x, bs1.y],
        }
    }).collect();

    FlatSvgResult {
        shelves,
        columns,
        bounds: SvgBounds {
            min_x: bounds.min_x,
            max_x: bounds.max_x,
            min_y: bounds.min_y,
            max_y: bounds.max_y,
        },
    }
}

// ---------------------------------------------------------------------------
// Project corner shelf geometry with rotation
// ---------------------------------------------------------------------------

pub fn project_corner_geometry(
    geo: &CornerShelfGeometry,
    angle: f64,
    width: f64,
    length: f64,
    tilt_deg: f64,
) -> CornerSvgResult {
    let center_x = width / 2.0;
    let center_y = length / 2.0;
    let project = |p: Vec3| rotate_and_project(p, angle, center_x, center_y, tilt_deg);

    let mut bounds = Bounds::new();

    let shelves: Vec<SvgCornerShelfPaths> = geo.shelves.iter().map(|s| {
        let front: Vec<Vec2> = s.front_edge.iter().map(|&p| { let pp = project(p); bounds.update(pp); pp }).collect();
        let back_x: Vec<Vec2> = s.back_edge_x.iter().map(|&p| { let pp = project(p); bounds.update(pp); pp }).collect();
        let back_y: Vec<Vec2> = s.back_edge_y.iter().map(|&p| { let pp = project(p); bounds.update(pp); pp }).collect();
        let ws0 = project(s.width_side[0]); bounds.update(ws0);
        let ws1 = project(s.width_side[1]); bounds.update(ws1);
        let ls0 = project(s.length_side[0]); bounds.update(ls0);
        let ls1 = project(s.length_side[1]); bounds.update(ls1);
        SvgCornerShelfPaths {
            front_path: points_to_path(&front),
            back_x_path: points_to_path(&back_x),
            back_y_path: points_to_path(&back_y),
            width_side: vec![ws0.x, ws0.y, ws1.x, ws1.y],
            length_side: vec![ls0.x, ls0.y, ls1.x, ls1.y],
        }
    }).collect();

    let columns: Vec<SvgColumnPaths> = geo.columns.iter().map(|c| {
        let front: Vec<Vec2> = c.front_edge.iter().map(|&p| { let pp = project(p); bounds.update(pp); pp }).collect();
        let back: Vec<Vec2> = c.back_edge.iter().map(|&p| { let pp = project(p); bounds.update(pp); pp }).collect();
        let ts0 = project(c.top_side[0]); bounds.update(ts0);
        let ts1 = project(c.top_side[1]); bounds.update(ts1);
        let bs0 = project(c.bottom_side[0]); bounds.update(bs0);
        let bs1 = project(c.bottom_side[1]); bounds.update(bs1);
        SvgColumnPaths {
            front_path: points_to_path(&front),
            back_path: points_to_path(&back),
            side_points: vec![ts0.x, ts0.y, ts1.x, ts1.y, bs0.x, bs0.y, bs1.x, bs1.y],
        }
    }).collect();

    CornerSvgResult {
        shelves,
        columns,
        bounds: SvgBounds {
            min_x: bounds.min_x,
            max_x: bounds.max_x,
            min_y: bounds.min_y,
            max_y: bounds.max_y,
        },
    }
}
