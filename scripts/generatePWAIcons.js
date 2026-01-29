/**
 * Script para gerar ícones PWA em múltiplos tamanhos
 *
 * Pré-requisitos:
 * npm install sharp --save-dev
 *
 * Uso:
 * node scripts/generatePWAIcons.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SOURCE_ICON = path.join(__dirname, '../Icone/4x/SistemaDePonto@4x.png')
const OUTPUT_DIR = path.join(__dirname, '../public/icons')
const SPLASH_DIR = path.join(__dirname, '../public/splash')

// Tamanhos necessários para PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512]

// Configurações de splash screen iOS
const SPLASH_SCREENS = [
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732' }, // iPad Pro 12.9"
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388' }, // iPad Pro 11"
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048' }, // iPad
  { width: 1170, height: 2532, name: 'apple-splash-1170-2532' }, // iPhone 12/13 Pro
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436' }, // iPhone X/XS/11 Pro
  { width: 1080, height: 1920, name: 'apple-splash-1080-1920' }, // iPhone 6+/7+/8+
  { width: 750, height: 1334, name: 'apple-splash-750-1334' },   // iPhone 6/7/8
]

async function generateIcons() {
  // Criar diretórios se não existirem
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  if (!fs.existsSync(SPLASH_DIR)) {
    fs.mkdirSync(SPLASH_DIR, { recursive: true })
  }

  console.log('Gerando ícones PWA...')

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`)

    await sharp(SOURCE_ICON)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath)

    console.log(`  ✓ icon-${size}x${size}.png`)
  }

  // Gerar badge para notificações
  await sharp(SOURCE_ICON)
    .resize(72, 72)
    .png()
    .toFile(path.join(OUTPUT_DIR, 'badge-72x72.png'))
  console.log('  ✓ badge-72x72.png')

  console.log('\nGerando splash screens iOS...')

  for (const splash of SPLASH_SCREENS) {
    const outputPath = path.join(SPLASH_DIR, `${splash.name}.png`)

    // Criar imagem de splash com fundo colorido e ícone centralizado
    const iconSize = Math.min(splash.width, splash.height) * 0.3
    const icon = await sharp(SOURCE_ICON)
      .resize(Math.round(iconSize), Math.round(iconSize))
      .toBuffer()

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: { r: 244, g: 99, b: 110, alpha: 1 } // #f4636e
      }
    })
      .composite([{
        input: icon,
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath)

    console.log(`  ✓ ${splash.name}.png`)
  }

  console.log('\n✅ Todos os ícones foram gerados com sucesso!')
}

generateIcons().catch(console.error)
