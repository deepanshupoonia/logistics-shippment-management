CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'driver', 'warehouse', 'customer_service', 'operations')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    capacity_kg DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    sender_name VARCHAR(100),
    sender_address TEXT,
    receiver_name VARCHAR(100),
    receiver_address TEXT,
    
    -- New Detailed Package Info
    package_type VARCHAR(50), 
    weight_kg DECIMAL(10, 2),
    dimensions VARCHAR(50), -- e.g., '10x20x30 cm'
    special_handling BOOLEAN DEFAULT FALSE,
    handling_instructions TEXT,
    
    shipment_type VARCHAR(50), -- same-day, next-day, bulk
    status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned', 'held')),
    
    driver_id INTEGER REFERENCES users(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    route_plan TEXT, -- Basic route notes
    
    proof_of_delivery TEXT, -- Could be a signature or image URL
    notes TEXT,
    complaints TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment_history (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Basic Seed Data for All Roles
INSERT INTO users (name, email, password, role) VALUES
('Alice Customer', 'alice@gmail.com', '$2a$10$9c3w1A55o2t53i.R4EIn5.VFYXnS4GkXYtXyB4b9L2g0n/2H5wZg6', 'customer'),
('Driver Steve', 'steve@greenleaf.com', '$2a$10$9c3w1A55o2t53i.R4EIn5.VFYXnS4GkXYtXyB4b9L2g0n/2H5wZg6', 'driver'),
('Driver Anna', 'anna@greenleaf.com', '$2a$10$9c3w1A55o2t53i.R4EIn5.VFYXnS4GkXYtXyB4b9L2g0n/2H5wZg6', 'driver'),
('Driver Dave', 'dave@greenleaf.com', '$2a$10$9c3w1A55o2t53i.R4EIn5.VFYXnS4GkXYtXyB4b9L2g0n/2H5wZg6', 'driver'),
('Warehouse Wendy', 'wendy@greenleaf.com', '$2a$10$9c3w1A55o2t53i.R4EIn5.VFYXnS4GkXYtXyB4b9L2g0n/2H5wZg6', 'warehouse'),
('CS Agent Sarah', 'support@greenleaf.com', '$2a$10$9c3w1A55o2t53i.R4EIn5.VFYXnS4GkXYtXyB4b9L2g0n/2H5wZg6', 'customer_service'),
('Ops Manager Mark', 'ops@greenleaf.com', '$2a$10$9c3w1A55o2t53i.R4EIn5.VFYXnS4GkXYtXyB4b9L2g0n/2H5wZg6', 'operations')
ON CONFLICT (email) DO NOTHING;

-- Seed Vehicles
INSERT INTO vehicles (license_plate, capacity_kg) VALUES
('TRK-9000', 5000.00),
('VAN-8000', 1500.00),
('TRK-7000', 4000.00),
('VAN-1010', 1200.00)
ON CONFLICT (license_plate) DO NOTHING;

-- Seed Dummy Shipments across various statuses
INSERT INTO shipments (tracking_number, sender_name, sender_address, receiver_name, receiver_address, package_type, weight_kg, dimensions, special_handling, shipment_type, status, driver_id, vehicle_id, notes, complaints, route_plan) VALUES
('GL-WHD837', 'TechDist Corp', '101 Industrial Pkwy', 'Alice Smith', '123 Main St, City A', 'regular', 2.50, '20x20x20', FALSE, 'standard', 'registered', NULL, NULL, 'Leave at front door.', NULL, NULL),
('GL-FRG992', 'MedSupplies Inc', '400 Enterprise Way', 'City Hospital', '999 Health Blvd, City B', 'medical', 15.00, '50x50x40', TRUE, 'same-day', 'ready_for_pickup', NULL, NULL, 'Fragile, keep upright.', NULL, NULL),
('GL-TRN104', 'Global Retail', 'Warehouse 7', 'Bob Johnson', '456 Oak Rd, City C', 'regular', 5.00, '30x20x15', FALSE, 'next-day', 'in_transit', (SELECT id FROM users WHERE email='steve@greenleaf.com' LIMIT 1), (SELECT id FROM vehicles WHERE license_plate='TRK-9000' LIMIT 1), NULL, NULL, 'Morning Route C'),
('GL-ERR505', 'B2B Electronics', 'Supply Chain Hub', 'Charlie Brown', '789 Pine Ln, City D', 'pallet', 50.00, '120x100x150', FALSE, 'standard', 'failed', (SELECT id FROM users WHERE email='steve@greenleaf.com' LIMIT 1), (SELECT id FROM vehicles WHERE license_plate='VAN-8000' LIMIT 1), NULL, '[10:00:00]: Customer not available at address.', 'Afternoon Route D'),
('GL-XYZ123', 'Office Supply Co', 'Building 2', 'Jessica Jones', '88 Office Park, City E', 'regular', 3.20, '15x15x15', FALSE, 'standard', 'registered', NULL, NULL, 'Deliver to reception.', NULL, NULL),
('GL-ABC987', 'Farm Fresh Inc', 'Rural Route 9', 'Gordon Fresh', 'Market Square, City F', 'perishable', 12.00, '40x30x30', TRUE, 'same-day', 'ready_for_pickup', NULL, NULL, 'Keep cool.', NULL, NULL),
('GL-LMN456', 'Fashion Hub', 'Garment District 1', 'Lily Ward', 'Boutique 4, City G', 'regular', 4.50, '60x40x10', FALSE, 'next-day', 'in_transit', (SELECT id FROM users WHERE email='anna@greenleaf.com' LIMIT 1), (SELECT id FROM vehicles WHERE license_plate='TRK-7000' LIMIT 1), NULL, NULL, 'Route G Express'),
('GL-PQR654', 'Home Decor', 'Design St 99', 'Tom Builder', 'Plot 12, City H', 'fragile', 8.00, '30x30x50', TRUE, 'standard', 'in_transit', (SELECT id FROM users WHERE email='anna@greenleaf.com' LIMIT 1), (SELECT id FROM vehicles WHERE license_plate='TRK-7000' LIMIT 1), NULL, NULL, 'Route G Express'),
('GL-STU321', 'Sporting Goods', 'Gym Avenue 5', 'Mike Runner', 'Arena 1, City I', 'regular', 10.00, '80x20x20', FALSE, 'standard', 'failed', (SELECT id FROM users WHERE email='anna@greenleaf.com' LIMIT 1), (SELECT id FROM vehicles WHERE license_plate='TRK-7000' LIMIT 1), NULL, '[11:00:00]: Gate code missing.', 'Route G Express'),
('GL-VWX789', 'Mega Books', 'Print Shop Rd', 'Book Store', 'Corner Shop, City J', 'pallet', 200.00, '120x120x100', FALSE, 'bulk', 'delivered', (SELECT id FROM users WHERE email='dave@greenleaf.com' LIMIT 1), (SELECT id FROM vehicles WHERE license_plate='VAN-1010' LIMIT 1), 'Signed by receiver.', NULL, 'Route J Heavy'),
('GL-DEF111', 'Coffee Roasters', 'Bean St 22', 'Cafe Latté', 'Down Town 5, City K', 'regular', 6.00, '30x30x30', FALSE, 'next-day', 'delivered', (SELECT id FROM users WHERE email='dave@greenleaf.com' LIMIT 1), (SELECT id FROM vehicles WHERE license_plate='VAN-1010' LIMIT 1), 'Left at back door.', NULL, 'Route J Heavy'),
('GL-GHI222', 'Tech Gizmos', 'Silicon Valley', 'Nerd Shop', 'Mall 2, City L', 'electronic', 2.00, '10x10x10', TRUE, 'same-day', 'held', NULL, NULL, 'Awaiting customer response for address.', '[09:00:00 CS Call]: Customer promised to call back.', NULL),
('GL-JKL333', 'Part Suppliers', 'Auto Zone 4', 'Mechanic John', 'Garage 8, City M', 'regular', 25.00, '60x60x60', FALSE, 'standard', 'ready_for_pickup', NULL, NULL, 'Heavy item.', NULL, NULL),
('GL-MNO444', 'Toy Factory', 'Fun Lane 1', 'Kids Store', 'Plaza Center, City N', 'regular', 9.00, '50x40x40', FALSE, 'standard', 'registered', NULL, NULL, NULL, NULL, NULL),
('GL-ALICE99', 'Alice Customer', '123 Wonderland Ave', 'The Mad Hatter', 'Tea Party Ln, City X', 'fragile', 1.50, '20x20x20', TRUE, 'next-day', 'registered', NULL, NULL, 'Handle with care!', NULL, NULL)
ON CONFLICT (tracking_number) DO NOTHING;
