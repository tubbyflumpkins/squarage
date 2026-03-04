use crate::types::Vec2;

const ALPHA: f64 = 0.5; // Centripetal parameterization

pub fn dist(a: Vec2, b: Vec2) -> f64 {
    ((a.x - b.x).powi(2) + (a.y - b.y).powi(2)).sqrt()
}

pub fn barry_goldman(
    p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
    t0: f64, t1: f64, t2: f64, t3: f64,
    t: f64,
) -> Vec2 {
    let d10 = if (t1 - t0).abs() < 1e-10 { 1e-10 } else { t1 - t0 };
    let d21 = if (t2 - t1).abs() < 1e-10 { 1e-10 } else { t2 - t1 };
    let d32 = if (t3 - t2).abs() < 1e-10 { 1e-10 } else { t3 - t2 };
    let d20 = if (t2 - t0).abs() < 1e-10 { 1e-10 } else { t2 - t0 };
    let d31 = if (t3 - t1).abs() < 1e-10 { 1e-10 } else { t3 - t1 };

    let a1x = p0.x * (t1 - t) / d10 + p1.x * (t - t0) / d10;
    let a1y = p0.y * (t1 - t) / d10 + p1.y * (t - t0) / d10;
    let a2x = p1.x * (t2 - t) / d21 + p2.x * (t - t1) / d21;
    let a2y = p1.y * (t2 - t) / d21 + p2.y * (t - t1) / d21;
    let a3x = p2.x * (t3 - t) / d32 + p3.x * (t - t2) / d32;
    let a3y = p2.y * (t3 - t) / d32 + p3.y * (t - t2) / d32;

    let b1x = a1x * (t2 - t) / d20 + a2x * (t - t0) / d20;
    let b1y = a1y * (t2 - t) / d20 + a2y * (t - t0) / d20;
    let b2x = a2x * (t3 - t) / d31 + a3x * (t - t1) / d31;
    let b2y = a2y * (t3 - t) / d31 + a3y * (t - t1) / d31;

    Vec2 {
        x: b1x * (t2 - t) / d21 + b2x * (t - t1) / d21,
        y: b1y * (t2 - t) / d21 + b2y * (t - t1) / d21,
    }
}

/// Centripetal Catmull-Rom through 5 points for flat shelf.
/// Ghost point direction depends on whether the endpoint is rounded.
pub fn centripetal_interpolate_5_flat(
    points: &[Vec2; 5],
    u: f64,
    round_left: bool,
    round_right: bool,
) -> Vec2 {
    let mut raw = [0.0_f64; 5];
    for i in 1..5 {
        raw[i] = raw[i - 1] + dist(points[i], points[i - 1]).powf(ALPHA);
    }
    let total = raw[4];
    if total < 1e-10 {
        return points[2];
    }
    let k: [f64; 5] = [
        raw[0] / total,
        raw[1] / total,
        raw[2] / total,
        raw[3] / total,
        raw[4] / total,
    ];

    // Ghost point BEFORE P0
    let d01 = dist(points[0], points[1]).max(1.0);
    let ghost_before = if round_left {
        Vec2 { x: points[0].x, y: points[0].y - d01 } // Perpendicular to back wall
    } else {
        Vec2 { x: points[0].x - d01, y: points[0].y } // Horizontal arrival at edge
    };
    let k_before = k[0] - dist(ghost_before, points[0]).powf(ALPHA) / total;

    // Ghost point AFTER P4
    let d34 = dist(points[3], points[4]).max(1.0);
    let ghost_after = if round_right {
        Vec2 { x: points[4].x, y: points[4].y - d34 } // Perpendicular to back wall
    } else {
        Vec2 { x: points[4].x + d34, y: points[4].y } // Horizontal arrival at edge
    };
    let k_after = k[4] + dist(points[4], ghost_after).powf(ALPHA) / total;

    let t = u.clamp(0.0, 1.0);

    if t <= k[1] {
        barry_goldman(ghost_before, points[0], points[1], points[2], k_before, k[0], k[1], k[2], t)
    } else if t <= k[2] {
        barry_goldman(points[0], points[1], points[2], points[3], k[0], k[1], k[2], k[3], t)
    } else if t <= k[3] {
        barry_goldman(points[1], points[2], points[3], points[4], k[1], k[2], k[3], k[4], t)
    } else {
        barry_goldman(points[2], points[3], points[4], ghost_after, k[2], k[3], k[4], k_after, t)
    }
}

/// Centripetal Catmull-Rom through 5 points for corner shelf.
/// Ghost points always perpendicular to walls.
pub fn centripetal_interpolate_5(points: &[Vec2; 5], u: f64) -> Vec2 {
    let mut raw = [0.0_f64; 5];
    for i in 1..5 {
        raw[i] = raw[i - 1] + dist(points[i], points[i - 1]).powf(ALPHA);
    }
    let total = raw[4];
    if total < 1e-10 {
        return points[2];
    }
    let k: [f64; 5] = [
        raw[0] / total,
        raw[1] / total,
        raw[2] / total,
        raw[3] / total,
        raw[4] / total,
    ];

    let d01 = dist(points[0], points[1]).max(1.0);
    let ghost_before = Vec2 { x: points[0].x, y: points[0].y - d01 };
    let k_before = k[0] - dist(ghost_before, points[0]).powf(ALPHA) / total;

    let d34 = dist(points[3], points[4]).max(1.0);
    let ghost_after = Vec2 { x: points[4].x - d34, y: points[4].y };
    let k_after = k[4] + dist(points[4], ghost_after).powf(ALPHA) / total;

    let t = u.clamp(0.0, 1.0);

    if t <= k[1] {
        barry_goldman(ghost_before, points[0], points[1], points[2], k_before, k[0], k[1], k[2], t)
    } else if t <= k[2] {
        barry_goldman(points[0], points[1], points[2], points[3], k[0], k[1], k[2], k[3], t)
    } else if t <= k[3] {
        barry_goldman(points[1], points[2], points[3], points[4], k[1], k[2], k[3], k[4], t)
    } else {
        barry_goldman(points[2], points[3], points[4], ghost_after, k[2], k[3], k[4], k_after, t)
    }
}
