import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Migration Script: Convert expense_categories from collection to single document
 * 
 * This script migrates expense categories from:
 *   expense_categories/{categoryId} → { name, requiresNote, ... }
 * 
 * To:
 *   expense_categories/config → { categories: { [name]: { requiresNote, ... } }, updatedAt }
 */

async function migrateExpenseCategories() {
    console.log('🚀 Starting expense categories migration...\n');

    // Initialize Firebase Admin
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

    if (!fs.existsSync(serviceAccountPath)) {
        console.error('❌ Error: serviceAccountKey.json not found!');
        console.error('   Please download it from Firebase Console > Project Settings > Service Accounts');
        console.error(`   Expected location: ${serviceAccountPath}`);
        process.exit(1);
    }

    const serviceAccount = require(serviceAccountPath);

    // Check if app is already initialized
    const admin = require('firebase-admin');
    let app;
    try {
        app = admin.app();
        console.log('ℹ️  Using existing Firebase Admin app\n');
    } catch (error) {
        app = initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('ℹ️  Initialized new Firebase Admin app\n');
    }

    const db = getFirestore();

    try {
        // Step 1: Read all existing categories from the collection
        console.log('📖 Reading existing categories from collection...');
        const categoriesCollectionRef = db.collection('expense_categories');
        const snapshot = await categoriesCollectionRef.get();

        if (snapshot.empty) {
            console.log('⚠️  No categories found in the collection.');
            console.log('   Creating config document with empty categories map...\n');

            const configRef = db.collection('expense_categories').doc('config');
            await configRef.set({
                categories: {},
                updatedAt: Date.now()
            });

            console.log('✅ Created empty config document');
            return;
        }

        // Step 2: Build the categories map
        console.log(`   Found ${snapshot.size} categories\n`);
        const categoriesMap: Record<string, any> = {};

        snapshot.forEach((doc) => {
            const data = doc.data();
            const categoryName = data.name;

            console.log(`   - ${categoryName}`);

            categoriesMap[categoryName] = {
                requiresNote: data.requiresNote || false,
                createdAt: data.createdAt,
                createdBy: data.createdBy
            };
        });

        // Step 3: Write to the new config document
        console.log('\n💾 Writing to config document...');
        const configRef = db.collection('expense_categories').doc('config');
        await configRef.set({
            categories: categoriesMap,
            updatedAt: Date.now()
        });

        console.log('✅ Config document created successfully\n');

        // Step 4: Verify the migration
        console.log('🔍 Verifying migration...');
        const configSnap = await configRef.get();
        if (configSnap.exists) {
            const configData = configSnap.data();
            const categoryCount = Object.keys(configData?.categories || {}).length;
            console.log(`   ✓ Config document exists`);
            console.log(`   ✓ Contains ${categoryCount} categories`);

            if (categoryCount === snapshot.size) {
                console.log('   ✓ Category count matches!\n');
            } else {
                console.warn('   ⚠️  Category count mismatch!\n');
            }
        }

        // Step 5: Ask about cleanup
        console.log('📋 Migration Summary:');
        console.log(`   • Migrated ${snapshot.size} categories`);
        console.log(`   • Created expense_categories/config document`);
        console.log(`   • Old documents in collection are still present\n`);

        console.log('⚠️  MANUAL STEP REQUIRED:');
        console.log('   After verifying the application works correctly,');
        console.log('   you can manually delete the old category documents from Firestore Console.');
        console.log('   Collection: expense_categories (individual documents, not "config")\n');

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration
migrateExpenseCategories()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
