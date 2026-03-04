use crate::types::DerivedParams;

const COST_PER_SQFT: f64 = 40.0;

pub fn compute_amplitude(is_corner: bool, height: f64) -> f64 {
    let min_h = 24.0_f64;
    let max_h = 76.0_f64;
    let min_amp = if is_corner { 2.0 } else { 1.5 };
    let max_amp = 3.0_f64;
    let t = ((height - min_h) / (max_h - min_h)).clamp(0.0, 1.0);
    min_amp + t * (max_amp - min_amp)
}

pub fn compute_column_angle(width: f64, length: f64) -> f64 {
    let ratio = width / length;
    let cap_ratio = 1.5_f64;
    if ratio >= 1.0 {
        let t = ((ratio - 1.0) / (cap_ratio - 1.0)).min(1.0);
        45.0 + t * 15.0
    } else {
        let t = ((1.0 / ratio - 1.0) / (cap_ratio - 1.0)).min(1.0);
        45.0 - t * 15.0
    }
}

pub fn compute_shelf_offset(is_corner: bool, height: f64) -> f64 {
    if is_corner {
        let t = ((height - 24.0) / (76.0 - 24.0)).clamp(0.0, 1.0);
        (2.0 + t * 4.0).round()
    } else {
        let t = ((height - 24.0) / (76.0 - 24.0)).clamp(0.0, 1.0);
        (2.0 + t * 4.0).round()
    }
}

pub fn compute_column_offset(is_corner: bool, width: f64, length: f64) -> f64 {
    if is_corner {
        let dim = width.max(length);
        let t = ((dim - 10.0) / (76.0 - 10.0)).clamp(0.0, 1.0);
        (6.0 + t * 4.0).round()
    } else {
        let t = ((width - 24.0) / (76.0 - 24.0)).clamp(0.0, 1.0);
        (2.0 + t * 4.0).round()
    }
}

pub fn compute_price(
    is_corner: bool,
    width: f64,
    height: f64,
    depth: f64,
    length: f64,
    shelf_count: u32,
    column_count: u32,
) -> f64 {
    let total_sq_in = if is_corner {
        let shelf_area = shelf_count as f64 * (width + length - depth) * depth;
        let col_area = column_count as f64 * height * depth;
        shelf_area + col_area
    } else {
        let shelf_area = shelf_count as f64 * width * depth;
        let col_area = column_count as f64 * height * depth;
        shelf_area + col_area
    };
    (total_sq_in / 144.0) * COST_PER_SQFT
}

pub fn compute_all(
    is_corner: bool,
    width: f64,
    height: f64,
    depth: f64,
    length: f64,
    shelf_count: u32,
    column_count: u32,
) -> DerivedParams {
    DerivedParams {
        amplitude: compute_amplitude(is_corner, height),
        shelf_offset: compute_shelf_offset(is_corner, height),
        column_offset: compute_column_offset(is_corner, width, length),
        column_angle: compute_column_angle(width, length),
        price: compute_price(is_corner, width, height, depth, length, shelf_count, column_count),
    }
}
