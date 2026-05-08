const mongoose = require('mongoose');

// Your MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

// If you have .env.local file, you can read it manually
const fs = require('fs');
const path = require('path');

// Try to read .env.local file if it exists
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^MONGODB_URI=(.*)$/);
      if (match) {
        return match[1].trim();
      }
    }
  }
  return null;
}

async function updateProductReferences() {
  try {
    // Get MongoDB URI
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      mongoUri = loadEnvFile();
    }
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found. Please set it in .env.local or provide it directly');
      console.log('\nYou can either:');
      console.log('1. Set MONGODB_URI in your environment: export MONGODB_URI="your-connection-string"');
      console.log('2. Or edit this script and add your connection string directly');
      process.exit(1);
    }
    
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Get your actual brands and categories
    const brands = await mongoose.connection.db.collection('brands').find({}).toArray();
    const categories = await mongoose.connection.db.collection('categories').find({}).toArray();
    
    if (brands.length === 0) {
      console.log('⚠️ No brands found in database. Creating default brands...');
      // Create default brands
      const defaultBrands = [
        { name: 'Sony', slug: 'sony', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Earbud', slug: 'earbud', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Apple', slug: 'apple', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Samsung', slug: 'samsung', isActive: true, createdAt: new Date(), updatedAt: new Date() }
      ];
      
      for (const brand of defaultBrands) {
        const result = await mongoose.connection.db.collection('brands').insertOne(brand);
        brands.push({ ...brand, _id: result.insertedId });
        console.log(`   ✅ Created brand: ${brand.name}`);
      }
    }
    
    if (categories.length === 0) {
      console.log('⚠️ No categories found in database. Creating default categories...');
      // Create default categories
      const defaultCategories = [
        { name: 'Electronics', slug: 'electronics', specificationTemplate: [], status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Head Phones', slug: 'head-phones', specificationTemplate: [], status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Earbud', slug: 'earbud', specificationTemplate: [], status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Smartphones', slug: 'smartphones', specificationTemplate: [], status: 'active', createdAt: new Date(), updatedAt: new Date() }
      ];
      
      for (const category of defaultCategories) {
        const result = await mongoose.connection.db.collection('categories').insertOne(category);
        categories.push({ ...category, _id: result.insertedId });
        console.log(`   ✅ Created category: ${category.name}`);
      }
    }
    
    console.log('\n📊 Existing Brands:');
    brands.forEach(b => console.log(`  ${b.name} -> ${b._id}`));
    
    console.log('\n📊 Existing Categories:');
    categories.forEach(c => console.log(`  ${c.name} -> ${c._id}`));
    
    // Create mapping
    const brandMap = {
      'sony': brands.find(b => b.name.toLowerCase() === 'sony')?._id,
      'earbud': brands.find(b => b.name.toLowerCase() === 'earbud')?._id,
      'samsung': brands.find(b => b.name.toLowerCase() === 'samsung')?._id,
      'apple': brands.find(b => b.name.toLowerCase() === 'apple')?._id,
    };
    
    const categoryMap = {
      'headphones': categories.find(c => c.name.toLowerCase() === 'head phones')?._id,
      'earbud': categories.find(c => c.name.toLowerCase() === 'earbud')?._id,
      'electronics': categories.find(c => c.name.toLowerCase() === 'electronics')?._id,
      'smartphones': categories.find(c => c.name.toLowerCase() === 'smartphones')?._id,
    };
    
    console.log('\n🔧 Product Mapping:');
    console.log('  Brand Map:', Object.fromEntries(Object.entries(brandMap).map(([k,v]) => [k, v?.toString()])));
    console.log('  Category Map:', Object.fromEntries(Object.entries(categoryMap).map(([k,v]) => [k, v?.toString()])));
    
    // Get all products
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`\n📦 Found ${products.length} products to process\n`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      const updates = {};
      
      console.log(`\n📝 Processing: ${product.name}`);
      
      // Determine correct brand based on product name
      let correctBrandId = null;
      const productNameLower = product.name.toLowerCase();
      
      if (productNameLower.includes('sony')) {
        correctBrandId = brandMap['sony'];
        console.log(`   Detected brand: Sony`);
      } else if (productNameLower.includes('earbud')) {
        correctBrandId = brandMap['earbud'];
        console.log(`   Detected brand: Earbud`);
      } else if (productNameLower.includes('apple')) {
        correctBrandId = brandMap['apple'];
        console.log(`   Detected brand: Apple`);
      } else if (productNameLower.includes('samsung')) {
        correctBrandId = brandMap['samsung'];
        console.log(`   Detected brand: Samsung`);
      }
      
      if (correctBrandId && (!product.brandId || product.brandId.toString() !== correctBrandId.toString())) {
        updates.brandId = correctBrandId;
        needsUpdate = true;
        console.log(`   Old brand: ${product.brandId || 'none'}`);
        console.log(`   New brand: ${correctBrandId}`);
      }
      
      // Determine correct category based on product name
      let correctCategoryId = null;
      
      if (productNameLower.includes('headphone')) {
        correctCategoryId = categoryMap['headphones'];
        console.log(`   Detected category: Head Phones`);
      } else if (productNameLower.includes('earbud')) {
        correctCategoryId = categoryMap['earbud'];
        console.log(`   Detected category: Earbud`);
      } else if (productNameLower.includes('smartphone') || productNameLower.includes('phone')) {
        correctCategoryId = categoryMap['smartphones'];
        console.log(`   Detected category: Smartphones`);
      } else if (!correctCategoryId) {
        correctCategoryId = categoryMap['electronics'];
        console.log(`   Using default category: Electronics`);
      }
      
      if (correctCategoryId && (!product.categoryId || product.categoryId.toString() !== correctCategoryId.toString())) {
        updates.categoryId = correctCategoryId;
        needsUpdate = true;
        console.log(`   Old category: ${product.categoryId || 'none'}`);
        console.log(`   New category: ${correctCategoryId}`);
      }
      
      // Update the product
      if (needsUpdate && Object.keys(updates).length > 0) {
        await mongoose.connection.db.collection('products').updateOne(
          { _id: product._id },
          { $set: updates }
        );
        updatedCount++;
        console.log(`   ✅ Updated!`);
      } else {
        console.log(`   ℹ️ No updates needed - references are correct`);
      }
    }
    
    console.log(`\n\n✅ Completed! Updated ${updatedCount} out of ${products.length} products`);
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...\n');
    const fixedProducts = await mongoose.connection.db.collection('products').find({}).toArray();
    
    for (const product of fixedProducts) {
      let brandValid = null;
      let categoryValid = null;
      
      if (product.brandId) {
        brandValid = await mongoose.connection.db.collection('brands').findOne({ _id: product.brandId });
      }
      
      if (product.categoryId) {
        categoryValid = await mongoose.connection.db.collection('categories').findOne({ _id: product.categoryId });
      }
      
      console.log(`📦 ${product.name}`);
      console.log(`   Brand: ${brandValid ? '✅ ' + brandValid.name : '❌ Missing'}`);
      console.log(`   Category: ${categoryValid ? '✅ ' + categoryValid.name : '❌ Missing'}`);
      console.log('');
    }
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
updateProductReferences();