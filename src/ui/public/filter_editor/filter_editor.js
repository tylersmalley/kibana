import angular from 'angular';
import { debounce } from 'lodash';

import template from 'ui/filter_editor/filter_editor.html';
import IndexPatternsFieldListProvider from 'ui/index_patterns/_field_list';

import { destructured, structured } from './lib/transform_filter';

import uiModules from 'ui/modules';
var module = uiModules.get('kibana');

// TODO: improved naming of filter/filters
// TODO: fields should be consistant with list in discover
// TODO: auto-complete for query

// Questions:
// TODO: Should we move delete to make more space for field name?

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

      $scope.filters = destructured($scope.filter);

      $scope.$watch('filters', debounce(function (filters) {
        $scope.filter = structured($scope.filters);
      }, 10), true);

      $scope.add = function () {
        $scope.filters.push({
          match: {
            query: '',
            type: 'phrase'
          },
          field: $scope.fields[0].name,
          clause: 'should'
        });
      };

      $scope.remove = function (index) {
        $scope.filters.splice(index, 1);
      };
    }
  };
});
