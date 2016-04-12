import angular from 'angular';
import { debounce } from 'lodash';

import template from 'ui/filter_editor/filter_editor.html';
import IndexPatternsFieldListProvider from 'ui/index_patterns/_field_list';

import uiModules from 'ui/modules';
var module = uiModules.get('kibana');

// TODO: able to persist
// TODO: improved naming of filter/filters
// TODO: fields should be consistant with list in discover
// TODO: auto-complete for query
// TODO: fix consistancy in JSON editor (query not triggering update)

/**
 * Notes:
 *
 * Order is not preserved due to the bool filter API
 */

module.directive('filterEditor', function ($route, Private) {
  const searchSource = $route.current.locals.savedSearch.searchSource;

  return {
    restrict: 'E',
    template: template,
    scope: {
      filter: '='
    },

    link: function ($scope) {
      $scope.fields = searchSource.get('index').fields.filter(function (field) {
        return field.filterable === true;
      }).sort(function (a, b) {
        // TODO: should I just use sortBy?
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });

      // TODO: remove me
      window.$scope = $scope;

      $scope.filters = destructuredFilter();

      $scope.$watch('filters', debounce(function (filters) {
        $scope.filter = structuredFilter();
      }, 10), true);

      // $scope.$watch('filter', debounce(function (filter) {
      //   if (flag) {
      //     flag = false;
      //     return;
      //   }
      //
      //   $scope.filters = destructuredFilter();
      //   flag = true;
      //
      //   console.log('json filter changed', filter);
      // }, 10), true);

      $scope.add = function () {
        $scope.filters.push({
          match: {
            query: '',
            type: 'phrase'
          },
          field: $scope.fields[0].name,
          clause: 'must'
        });
      };

      $scope.remove = function (index) {
        $scope.filters.splice(index, 1);
      };

      /**
       * Converts:
       *   agent: {
       *     query: 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)',
       *     type: 'phrase'
       *   }
       *
       * to:
       *   {
       *     match: {
       *       query: 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)',
       *       type: 'phrase'
       *     },
       *     field: 'agent'
       *   }
       */

      function transformMatch(match) {
        const keys = Object.keys(match);

        // TODO: handle exception
        const field = keys[0];

        return {
          match: match[field],
          field: field,
          clause: 'must'
        };
      }

      function destructuredFilter() {
        let filters = [];

        console.time('destructuredFilter');

        if ($scope.filter.query) {
          return [ transformMatch($scope.filter.query.match) ];
        }

        if ($scope.filter.bool) {
          Object.keys($scope.filter.bool).forEach(function forEachClause(clause) {
            let filter = $scope.filter.bool[clause];

            filter.forEach(function forEachFilter(filter) {
              filters.push(Object.assign(transformMatch(filter.match), { clause: clause }));
            });
          });

          console.timeEnd('destructuredFilter');

          return filters;
        }
      }

      function structuredFilter() {
        let bool = {};

        console.time('structuredFilter');

        $scope.filters.forEach(function (filter) {
          let match = {};

          if (!bool.hasOwnProperty(filter.clause)) {
            bool[filter.clause] = [];
          }

          match[filter.field] = filter.match;
          bool[filter.clause].push({ match: match });
        });

        console.timeEnd('structuredFilter');

        return { bool: bool };
      }
    }
  };
});
