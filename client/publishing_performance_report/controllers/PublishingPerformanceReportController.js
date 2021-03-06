import {getErrorMessage} from '../../utils';
import {DATE_FILTERS} from '../../search/directives/DateFilters';

PublishingPerformanceReportController.$inject = [
    '$scope',
    'gettext',
    'gettextCatalog',
    'lodash',
    'savedReports',
    'searchReport',
    'notify',
    'moment',
    'config',
    '$q',
    'chartConfig',
    '$interpolate',
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.publishing-performance-report
 * @name PublishingPerformanceReportController
 * @requires $scope
 * @requires gettext
 * @requires gettextCatalog
 * @requires lodash
 * @requires savedReports
 * @requires searchReport
 * @requires notify
 * @requires moment
 * @requires config
 * @requires $q
 * @requires chartConfig
 * @requires $interpolate
 * @description Controller for Publishing Performance reports
 */
export function PublishingPerformanceReportController(
    $scope,
    gettext,
    gettextCatalog,
    _,
    savedReports,
    searchReport,
    notify,
    moment,
    config,
    $q,
    chartConfig,
    $interpolate
) {
    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.currentTab = 'parameters';
        $scope.dateFilters = [
            DATE_FILTERS.YESTERDAY,
            DATE_FILTERS.LAST_WEEK,
            DATE_FILTERS.LAST_MONTH,
            DATE_FILTERS.RANGE,
        ];

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        this.chart = chartConfig.newConfig('chart', _.get($scope, 'currentParams.params.chart.type'));
        $scope.updateChartConfig();
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#initDefaultParams
     * @description Initialises the default report parameters
     */
    this.initDefaultParams = () => {
        $scope.item_states = searchReport.filterItemStates(
            ['published', 'killed', 'corrected', 'recalled']
        );

        $scope.chart_types = chartConfig.filterChartTypes(
            ['bar', 'column', 'table']
        );

        $scope.report_groups = searchReport.filterDataFields(
            ['task.desk', 'task.user', 'anpa_category.qcode', 'source', 'urgency', 'genre.qcode']
        );

        $scope.currentParams = {
            report: 'publishing_performance_report',
            params: {
                dates: {
                    filter: 'range',
                    start: moment()
                        .subtract(30, 'days')
                        .format(config.model.dateformat),
                    end: moment().format(config.model.dateformat),
                },
                must: {
                    categories: [],
                    genre: [],
                    sources: [],
                    urgency: [],
                    desks: [],
                    users: [],
                },
                must_not: {
                    rewrites: false,
                    states: {
                        published: false,
                        killed: false,
                        corrected: false,
                        recalled: false,
                    },
                },
                repos: {
                    ingest: false,
                    archive: false,
                    published: true,
                    archived: true,
                },
                min: 1,
                aggs: {
                    group: {
                        field: _.get($scope, 'report_groups[0].qcode') || 'task.desk',
                        size: 0,
                    },
                    subgroup: {
                        field: 'state',
                    },
                },
                chart: {
                    type: _.get($scope, 'chart_types[0].qcode') || 'bar',
                    sort_order: 'desc',
                    title: null,
                    subtitle: null,
                },
            },
        };

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);

        $scope.group_by = _.cloneDeep($scope.report_groups);
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#updateChartConfig
     * @param {boolean} reloadTranslations - Reloads text translations if true
     * @description Updates the local HighchartConfig instance parameters
     */
    $scope.updateChartConfig = (reloadTranslations = false) => {
        this.chart.chartType = _.get($scope, 'currentParams.params.chart.type');
        this.chart.sortOrder = _.get($scope, 'currentParams.params.chart.sort_order');
        this.chart.title = _.get($scope, 'currentParams.params.chart.title');
        this.chart.subtitle = _.get($scope, 'currentParams.params.chart.subtitle');

        this.chart.clearSources();
        this.chart.addSource(
            _.get($scope, 'currentParams.params.aggs.group.field'),
            {}
        );

        this.chart.addSource(
            _.get($scope, 'currentParams.params.aggs.subgroup.field'),
            {}
        );

        if (reloadTranslations) {
            this.chart.loadTranslations();
        }
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#generateTitle
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    $scope.generateTitle = (report) => generateTitle(
        $interpolate,
        gettextCatalog,
        this.chart,
        _.get($scope, 'currentParams.params') || {},
        report
    );

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#generateSubtitle
     * @return {String}
     * @description Returns the subtitle to use for the Highcharts config based on the date parameters
     */
    $scope.generateSubtitle = () => chartConfig.generateSubtitleForDates(
        _.get($scope, 'currentParams.params') || {}
    );

    $scope.isDirty = () => true;

    $scope.$watch(() => savedReports.currentReport._id, (newReportId) => {
        if (newReportId) {
            $scope.currentParams = _.cloneDeep(savedReports.currentReport);
            $scope.changePanel('advanced');
        } else {
            $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
        }
    });

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#onDateFilterChange
     * @description When the date filter changes, clear the date input fields if the filter is not 'range'
     */
    $scope.onDateFilterChange = () => {
        if ($scope.currentParams.params.dates.filter !== 'range') {
            $scope.currentParams.params.dates.start = null;
            $scope.currentParams.params.dates.end = null;
        }

        $scope.updateChartConfig();
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#runQuery
     * @param {Object} params - The report parameters used to search the data
     * @return {Object}
     * @description Queries the ContentPublishing API and returns it's response
     */
    $scope.runQuery = (params) => searchReport.query(
        'publishing_performance_report',
        params,
        true
    );

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#generate
     * @description Updates the Highchart configs in the report's content view
     */
    $scope.generate = () => {
        $scope.changeContentView('report');

        const params = _.cloneDeep($scope.currentParams.params);

        $scope.runQuery(params)
            .then((data) => {
                this.createChart(
                    Object.assign(
                        {},
                        $scope.currentParams.params,
                        data
                    )
                )
                    .then((chartConfig) => {
                        $scope.changeReportParams(chartConfig);
                    });
            }, (error) => {
                notify.error(
                    getErrorMessage(
                        error,
                        gettext('Error. The Publishing Report could not be generated!')
                    )
                );
            });
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#changeTab
     * @param {String} tabName - The name of the tab to change to
     * @description Change the current tab in the filters panel
     */
    $scope.changeTab = (tabName) => {
        $scope.currentTab = tabName;
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#createChart
     * @param {Object} report - The report parameters used to search the data
     * @return {Object}
     * @description Generates the Highcharts config from the report parameters
     */
    this.createChart = (report) => {
        this.chart.clearSources();

        if (Object.keys(report.groups).length === 1 && _.get(report, 'subgroups')) {
            this.chart.addSource(
                _.get(report, 'aggs.subgroup.field'),
                report.subgroups
            );
        } else {
            this.chart.addSource(
                _.get(report, 'aggs.group.field'),
                report.groups
            );

            if (_.get(report, 'subgroups')) {
                this.chart.addSource(
                    _.get(report, 'aggs.subgroup.field'),
                    report.subgroups
                );
            }
        }

        this.chart.getTitle = () => $scope.generateTitle(report);
        this.chart.getSubtitle = $scope.generateSubtitle;

        return this.chart.loadTranslations(_.get(report, 'aggs.group.field'))
            .then(() => this.chart.genConfig())
            .then((config) => ({
                charts: [config],
                wrapCharts: report.chart.type === 'table',
                height500: false,
                fullWidth: true,
                multiChart: false,
            }));
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#getReportParams
     * @return {Promise}
     * @description Loads field translations for this report and returns them along with current report params
     * This is used so that saving this report will also save the translations with it
     */
    $scope.getReportParams = () => {
        const groupField = _.get($scope.currentParams, 'params.aggs.group.field');
        const subgroupField = _.get($scope.currentParams, 'params.aggs.subgroup.field');

        return chartConfig.loadTranslations([groupField, subgroupField], true)
            .then(() => (
                $q.when(
                    Object.assign(
                        {},
                        $scope.currentParams,
                        {translations: chartConfig.translations}
                    )
                )
            ));
    };

    this.init();
}

/**
 * @ngdoc method
 * @name generateTitle
 * @param {angular.IInterpolateService} $interpolate
 * @param {Object} gettextCatalog - angular-gettext
 * @param {HighchartConfig} chart - HighchartConfig instance
 * @param {Object} params - Report parameters
 * @param {Object} report - Report results
 * @return {String}
 * @description Construct the title for the chart based on report parameters and results
 */
export const generateTitle = ($interpolate, gettextCatalog, chart, params, report = null) => {
    if (_.get(params, 'chart.title')) {
        return params.chart.title;
    }

    const parentField = _.get(params, 'aggs.group.field');
    const parentName = chart.getSourceName(parentField);

    if (report && Object.keys(report.groups).length === 1 && _.get(report, 'subgroups')) {
        const dataName = chart.getSourceTitle(
            parentField,
            Object.keys(report.groups)[0]
        );

        return $interpolate(
            gettextCatalog.getString('Published Stories for {{ group }}: {{ data }}')
        )({group: parentName, data: dataName});
    }

    return $interpolate(
        gettextCatalog.getString(
            'Published Stories per {{ group }}'
        )
    )({group: parentName});
};
