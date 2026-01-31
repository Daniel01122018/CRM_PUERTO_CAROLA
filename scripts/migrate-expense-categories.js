const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Migration Script: Convert expense_categories from collection to single document
 */

async function migrateExpenseCategories() {
    console.log('🚀 Starting expense categories migration...\n');

    // Load service account
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

    if (!fs.existsSync(serviceAccountPath)) {
        console.error('❌ Error: serviceAccountKey.json not found!');
        console.error(`   Expected location: ${serviceAccountPath}`);
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    // Initialize Firebase Admin (only if not already initialized)
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('ℹ️  Initialized Firebase Admin\n');
    }

    const db = admin.firestore();

    try {
        // Step 1: Read all existing categories
        console.log('📖 Reading existing categories from collection...');
        const categoriesSnapshot = await db.collection('expense_categories').get();

        if (categoriesSnapshot.empty) {
            console.log('⚠️  No categories found. Creating empty config...\n');

            await db.collection('expense_categories').doc('config').set({
                categories: {},
                updatedAt: Date.now()
            });

            console.log('✅ Created empty config document');
            return;
        }

        // Step 2: Build categories map
        console.log(`   Found ${categoriesSnapshot.size} categories\n`);
        const categoriesMap = {};

        categoriesSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`   - ${data.name}`);

            categoriesMap[data.name] = {
                requiresNote: data.requiresNote || false,
                createdAt: data.createdAt,
                createdBy: data.createdBy
            };
        });

        // Step 3: Write to config document
        console.log('\n💾 Writing to config document...');
        await db.collection('expense_categories').doc('config').set({
            categories: categoriesMap,
            updatedAt: Date.now()
        });

        console.log('✅ Config document created successfully\n');

        // Step 4: Verify
        console.log('🔍 Verifying migration...');
        const configDoc = await db.collection('expense_categories').doc('config').get();

        if (configDoc.exists) {
            const configData = configDoc.data();
            const categoryCount = Object.keys(configData.categories || {}).length;
            console.log(`   ✓ Config document exists`);
            console.log(`   ✓ Contains ${categoryCount} categories`);
            console.log(categoryCount === categoriesSnapshot.size ? '   ✓ Category count matches!\n' : '   ⚠️  Category count mismatch!\n');
        }

        // Step 5: Summary
        console.log('📋 Migration Summary:');
        console.log(`   • Migrated ${categoriesSnapshot.size} categories`);
        console.log(`   • Created expense_categories/config document`);
        console.log(`   • Old documents still present (delete manually after verifying)\n`);
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:');
        console.error(error);
        process.exit(1);
    }
}

// Run
migrateExpenseCategories()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
