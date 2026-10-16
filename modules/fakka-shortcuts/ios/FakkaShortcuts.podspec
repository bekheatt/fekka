Pod::Spec.new do |s|
  s.name           = 'FakkaShortcuts'
  s.version        = '1.0.0'
  s.summary        = 'Saves the automatic-logging endpoint for the Log Bank SMS Shortcuts action'
  s.description    = 'Saves the automatic-logging endpoint for the Log Bank SMS Shortcuts action'
  s.author         = ''
  s.homepage       = 'https://fakkaeg.com'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,swift}'
end
