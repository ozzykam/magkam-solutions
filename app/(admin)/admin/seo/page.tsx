'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TagInput from '@/components/admin/TagInput';
import CharacterCounter from '@/components/admin/CharacterCounter';
import SEOPreview from '@/components/admin/SEOPreview';
import SingleImageUploader from '@/components/admin/SingleImageUploader';
import {
  getAllSEOSettings,
  updateSEOSettings,
  initializeSEOSettings,
  validateSEOConfig,
} from '@/services/seo-service';
import { getStoreSettings } from '@/services/business-info-service';
import { SEOSettings, SEOPageConfig, SEOTemplateConfig, SEOTemplateType, DEFAULT_SEO_SETTINGS, SEOValidationError } from '@/types/seo';
import {
  GlobeAltIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

type TabType = 'global' | 'pages' | 'patterns' | 'templates';

export default function SEOSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SEOSettings | null>(null);
  const [businessName, setBusinessName] = useState('Your Store');

  // Global settings state
  const [globalKeywords, setGlobalKeywords] = useState<string[]>([]);
  const [globalDescription, setGlobalDescription] = useState('');
  const [globalOgImage, setGlobalOgImage] = useState('');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<SEOValidationError[]>([]);

  // Pages tab state
  const [editingPageRoute, setEditingPageRoute] = useState<string | null>(null);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [pageRoute, setPageRoute] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [pageKeywords, setPageKeywords] = useState<string[]>([]);
  const [pageOgImage, setPageOgImage] = useState('');
  const [pageNoindex, setPageNoindex] = useState(false);

  // Templates tab state
  const [editingTemplate, setEditingTemplate] = useState<SEOTemplateType | null>(null);
  const [templateTitleTemplate, setTemplateTitleTemplate] = useState('');
  const [templateDescriptionTemplate, setTemplateDescriptionTemplate] = useState('');
  const [templateKeywords, setTemplateKeywords] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // Initialize SEO settings if they don't exist
        await initializeSEOSettings();

        // Load SEO settings
        const seoSettings = await getAllSEOSettings();
        setSettings(seoSettings);

        // Load business settings
        const businessSettings = await getStoreSettings();
        setBusinessName(businessSettings.businessName || 'Your Store');

        // Set global form values
        setGlobalKeywords(seoSettings.global.keywords || []);
        setGlobalDescription(seoSettings.global.description || '');
        setGlobalOgImage(seoSettings.global.ogImage || '');
      } catch (error) {
        console.error('Error loading SEO settings:', error);
        alert('Failed to load SEO settings');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  // Real-time validation
  useEffect(() => {
    const config: SEOPageConfig = {
      description: globalDescription,
      keywords: globalKeywords,
    };
    const errors = validateSEOConfig(config);
    setValidationErrors(errors);
  }, [globalDescription, globalKeywords]);

  // Helper to get errors for a specific field
  const getFieldErrors = (field: string) => {
    return validationErrors.filter(err => err.field === field);
  };

  const handleSaveGlobal = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      // Build global object and remove undefined values
      const globalConfig: SEOSettings['global'] = {
        keywords: globalKeywords,
        description: globalDescription,
        twitterCard: settings.global.twitterCard,
        ...(globalOgImage && { ogImage: globalOgImage }),
      };

      const updatedSettings: Partial<SEOSettings> = {
        global: globalConfig,
      };

      await updateSEOSettings(updatedSettings);
      alert('Global SEO settings saved successfully!');
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      alert('Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  // Pages tab handlers
  const handleEditPage = (route: string) => {
    const pageConfig = settings?.pages[route];
    if (pageConfig) {
      setEditingPageRoute(route);
      setPageRoute(route);
      setPageTitle(pageConfig.title || '');
      setPageDescription(pageConfig.description || '');
      setPageKeywords(pageConfig.keywords || []);
      setPageOgImage(pageConfig.ogImage || '');
      setPageNoindex(pageConfig.noindex || false);
    }
  };

  const handleAddPageClick = () => {
    setIsAddingPage(true);
    setPageRoute('');
    setPageTitle('');
    setPageDescription('');
    setPageKeywords([]);
    setPageOgImage('');
    setPageNoindex(false);
  };

  const handleCancelPage = () => {
    setIsAddingPage(false);
    setEditingPageRoute(null);
    setPageRoute('');
    setPageTitle('');
    setPageDescription('');
    setPageKeywords([]);
    setPageOgImage('');
    setPageNoindex(false);
  };

  const handleSavePage = async () => {
    if (!settings || !pageRoute.trim()) {
      alert('Please enter a route');
      return;
    }

    try {
      setSaving(true);

      // Build config object and remove undefined values
      const newPageConfig: SEOPageConfig = {
        ...(pageTitle && { title: pageTitle }),
        ...(pageDescription && { description: pageDescription }),
        ...(pageKeywords.length > 0 && { keywords: pageKeywords }),
        ...(pageOgImage && { ogImage: pageOgImage }),
        ...(pageNoindex && { noindex: pageNoindex }),
      };

      const updatedPages = { ...settings.pages };

      // If editing, remove the old route if it changed
      if (editingPageRoute && editingPageRoute !== pageRoute) {
        delete updatedPages[editingPageRoute];
      }

      updatedPages[pageRoute] = newPageConfig;

      await updateSEOSettings({ pages: updatedPages });

      // Reload settings
      const seoSettings = await getAllSEOSettings();
      setSettings(seoSettings);

      alert('Page SEO settings saved successfully!');
      handleCancelPage();
    } catch (error) {
      console.error('Error saving page SEO:', error);
      alert('Failed to save page SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (route: string) => {
    if (!settings || !confirm(`Delete SEO settings for "${route}"?`)) return;

    try {
      setSaving(true);

      const updatedPages = { ...settings.pages };
      delete updatedPages[route];

      await updateSEOSettings({ pages: updatedPages });

      // Reload settings
      const seoSettings = await getAllSEOSettings();
      setSettings(seoSettings);

      alert('Page SEO settings deleted successfully!');
    } catch (error) {
      console.error('Error deleting page SEO:', error);
      alert('Failed to delete page SEO settings');
    } finally {
      setSaving(false);
    }
  };

  // Templates tab handlers
  const handleEditTemplate = (templateType: SEOTemplateType) => {
    const template = settings?.templates[templateType];
    if (template) {
      setEditingTemplate(templateType);
      setTemplateTitleTemplate(template.titleTemplate);
      setTemplateDescriptionTemplate(template.descriptionTemplate || '');
      setTemplateKeywords(template.keywords);
    }
  };

  const handleCancelTemplate = () => {
    setEditingTemplate(null);
    setTemplateTitleTemplate('');
    setTemplateDescriptionTemplate('');
    setTemplateKeywords([]);
  };

  const handleSaveTemplate = async () => {
    if (!settings || !editingTemplate) return;

    try {
      setSaving(true);

      // Build template object and remove undefined values
      const updatedTemplate: SEOTemplateConfig = {
        titleTemplate: templateTitleTemplate,
        keywords: templateKeywords,
        ...(templateDescriptionTemplate && { descriptionTemplate: templateDescriptionTemplate }),
      };

      const updatedTemplates = {
        ...settings.templates,
        [editingTemplate]: updatedTemplate,
      };

      await updateSEOSettings({ templates: updatedTemplates });

      // Reload settings
      const seoSettings = await getAllSEOSettings();
      setSettings(seoSettings);

      alert('Template saved successfully!');
      handleCancelTemplate();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load SEO settings</p>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'global',
      label: 'Global Settings',
      icon: <GlobeAltIcon className="w-5 h-5" />,
    },
    {
      id: 'pages',
      label: 'Page Overrides',
      icon: <DocumentTextIcon className="w-5 h-5" />,
    },
    {
      id: 'patterns',
      label: 'Route Patterns',
      icon: <CodeBracketIcon className="w-5 h-5" />,
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <PencilSquareIcon className="w-5 h-5" />,
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SEO Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage search engine optimization for your entire store. Customize meta tags, keywords, and descriptions for better search rankings.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Global SEO Defaults
              </h2>
              <p className="text-gray-600 mb-6">
                These settings apply to all pages unless overridden by specific page settings.
              </p>

              {/* Validation Summary */}
              {validationErrors.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        SEO Recommendations ({validationErrors.length})
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {validationErrors.filter(e => e.severity === 'error').length > 0
                          ? `${validationErrors.filter(e => e.severity === 'error').length} error(s), `
                          : ''}
                        {validationErrors.filter(e => e.severity === 'warning').length} warning(s) -
                        Review the fields below for best SEO practices.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Default Keywords */}
              <div className="mb-6">
                <TagInput
                  tags={globalKeywords}
                  onChange={setGlobalKeywords}
                  label="Default Keywords"
                  placeholder="Add a keyword..."
                  helperText="Keywords that apply to your entire site (e.g., local products, fresh food)"
                  maxTags={15}
                  maxLength={30}
                />
                {/* Validation Messages */}
                {getFieldErrors('keywords').map((error, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 mt-2 p-3 rounded-lg ${
                      error.severity === 'error'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    {error.severity === 'error' ? (
                      <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p
                      className={`text-sm ${
                        error.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                      }`}
                    >
                      {error.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Default Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Meta Description
                </label>
                <textarea
                  value={globalDescription}
                  onChange={(e) => setGlobalDescription(e.target.value)}
                  placeholder="A brief description of your store..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={160}
                />
                <CharacterCounter
                  current={globalDescription.length}
                  max={160}
                  warningThreshold={0.9}
                  className="mt-2"
                />
                {/* Validation Messages */}
                {getFieldErrors('description').map((error, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 mt-2 p-3 rounded-lg ${
                      error.severity === 'error'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    {error.severity === 'error' ? (
                      <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p
                      className={`text-sm ${
                        error.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                      }`}
                    >
                      {error.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Default OG Image */}
              <div className="mb-6">
                <SingleImageUploader
                  image={globalOgImage}
                  onChange={setGlobalOgImage}
                  folder="seo"
                  label="Default Open Graph Image"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Recommended size: 1200x630px. This image appears when your site is shared on social media.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSaveGlobal}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Global Settings'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card>
            <div className="p-6">
              <SEOPreview
                title={`${businessName} - Shop Fresh Local Products`}
                description={globalDescription || DEFAULT_SEO_SETTINGS.global.description}
                url="yourstore.com"
              />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Page-Specific SEO Overrides
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Customize SEO settings for specific pages like /shop, /about, etc.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddPageClick}
                  disabled={isAddingPage || editingPageRoute !== null}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Page
                </Button>
              </div>

              {/* Add/Edit Form */}
              {(isAddingPage || editingPageRoute) && (
                <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {isAddingPage ? 'Add New Page' : `Edit: ${editingPageRoute}`}
                  </h3>

                  <div className="space-y-4">
                    {/* Route */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Route <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={pageRoute}
                        onChange={(e) => setPageRoute(e.target.value)}
                        placeholder="/about"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={editingPageRoute !== null && !isAddingPage}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Examples: /shop, /about, /contact, /terms
                      </p>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Title (optional)
                      </label>
                      <input
                        type="text"
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                        placeholder="About Us | {businessName}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        maxLength={60}
                      />
                      <CharacterCounter current={pageTitle.length} max={60} className="mt-2" />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description (optional)
                      </label>
                      <textarea
                        value={pageDescription}
                        onChange={(e) => setPageDescription(e.target.value)}
                        placeholder="Learn about our mission..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        maxLength={160}
                      />
                      <CharacterCounter current={pageDescription.length} max={160} className="mt-2" />
                    </div>

                    {/* Keywords */}
                    <div>
                      <TagInput
                        tags={pageKeywords}
                        onChange={setPageKeywords}
                        label="Keywords (optional)"
                        placeholder="Add a keyword..."
                        maxTags={15}
                        maxLength={30}
                      />
                    </div>

                    {/* OG Image */}
                    <div>
                      <SingleImageUploader
                        image={pageOgImage}
                        onChange={setPageOgImage}
                        folder="seo"
                        label="Open Graph Image (optional)"
                      />
                    </div>

                    {/* Noindex */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pageNoindex"
                        checked={pageNoindex}
                        onChange={(e) => setPageNoindex(e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="pageNoindex" className="text-sm font-medium text-gray-700">
                        Prevent search engines from indexing this page (noindex)
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="primary"
                        onClick={handleSavePage}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Page'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleCancelPage}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* List of Pages */}
              <div className="space-y-2">
                {Object.keys(settings.pages || {}).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No page-specific SEO settings configured yet.</p>
                    <p className="text-sm mt-1">Click &quot;Add Page&quot; to create one.</p>
                  </div>
                ) : (
                  Object.entries(settings.pages || {}).map(([route, config]) => (
                    <div
                      key={route}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{route}</h3>
                          {config.noindex && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              noindex
                            </span>
                          )}
                        </div>
                        {config.title && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Title:</strong> {config.title}
                          </p>
                        )}
                        {config.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Description:</strong> {config.description}
                          </p>
                        )}
                        {config.keywords && config.keywords.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Keywords:</strong> {config.keywords.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditPage(route)}
                          disabled={isAddingPage || editingPageRoute !== null}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePage(route)}
                          disabled={saving}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Route Patterns
              </h2>
              <p className="text-gray-600 mb-6">
                Configure SEO for groups of pages using wildcards (e.g., /products/*, /account/*).
              </p>

              {/* List of patterns */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Pre-configured patterns:
                </p>
                <ul className="mt-2 space-y-2">
                  {Object.keys(settings.patterns || {}).map((pattern) => (
                    <li key={pattern} className="text-sm text-gray-700">
                      • {pattern}
                      {settings.patterns[pattern].noindex && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          noindex
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Dynamic Page Templates
              </h2>
              <p className="text-gray-600 mb-6">
                Configure SEO templates for dynamic pages. Use variables like {'{name}'}, {'{businessName}'}, etc.
              </p>

              {/* Template types */}
              <div className="space-y-4">
                {Object.entries(settings.templates || {}).map(([type, template]) => {
                  const templateType = type as SEOTemplateType;
                  const isEditing = editingTemplate === templateType;

                  // Available variables per template type
                  const availableVars = {
                    product: ['{name}', '{description}', '{categoryName}', '{vendorName}', '{businessName}'],
                    category: ['{name}', '{description}', '{businessName}'],
                    vendor: ['{name}', '{description}', '{location}', '{businessName}'],
                    contentPost: ['{title}', '{excerpt}', '{authorName}', '{categoryName}', '{businessName}'],
                  };

                  return (
                    <div key={type} className={`rounded-lg border-2 ${isEditing ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900 capitalize text-lg">
                            {type} Pages
                          </h3>
                          {!isEditing && (
                            <button
                              onClick={() => handleEditTemplate(templateType)}
                              disabled={editingTemplate !== null}
                              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <PencilIcon className="w-5 h-5" />
                              Edit Template
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-4">
                            {/* Available Variables Info */}
                            <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 mb-2">
                                Available Variables:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {availableVars[templateType].map((variable) => (
                                  <code key={variable} className="text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">
                                    {variable}
                                  </code>
                                ))}
                              </div>
                            </div>

                            {/* Title Template */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title Template <span className="text-red-600">*</span>
                              </label>
                              <input
                                type="text"
                                value={templateTitleTemplate}
                                onChange={(e) => setTemplateTitleTemplate(e.target.value)}
                                placeholder="{name} - {categoryName} | {businessName}"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Use variables like {availableVars[templateType].slice(0, 2).join(', ')}
                              </p>
                            </div>

                            {/* Description Template */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description Template (optional)
                              </label>
                              <textarea
                                value={templateDescriptionTemplate}
                                onChange={(e) => setTemplateDescriptionTemplate(e.target.value)}
                                placeholder="{description}"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>

                            {/* Keywords */}
                            <div>
                              <TagInput
                                tags={templateKeywords}
                                onChange={setTemplateKeywords}
                                label="Keywords"
                                placeholder="Add a keyword..."
                                maxTags={15}
                                maxLength={30}
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                              <Button
                                variant="primary"
                                onClick={handleSaveTemplate}
                                disabled={saving}
                              >
                                {saving ? 'Saving...' : 'Save Template'}
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={handleCancelTemplate}
                                disabled={saving}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 space-y-2">
                            <p>
                              <strong className="text-gray-700">Title:</strong>{' '}
                              <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                {template.titleTemplate}
                              </code>
                            </p>
                            {template.descriptionTemplate && (
                              <p>
                                <strong className="text-gray-700">Description:</strong>{' '}
                                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                  {template.descriptionTemplate}
                                </code>
                              </p>
                            )}
                            <p>
                              <strong className="text-gray-700">Keywords:</strong>{' '}
                              {template.keywords.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
