import angular from 'angular';
import { pull } from 'lodash';

import template from 'ui/filter_editor/filter_editor.html';
import IndexPatternsFieldListProvider from 'ui/index_patterns/_field_list';

import uiModules from 'ui/modules';
var module = uiModules.get('kibana');

/**
 * Notes:
 *
 * Order is not preserved due to the bool filter API
 */

module.directive('filterEditor', function ($route, Private) {
  const FieldList = Private(IndexPatternsFieldListProvider);
  const searchSource = $route.current.locals.savedSearch.searchSource;

  return {
    restrict: 'E',
    template: template,
    scope: {
      filter: '@'
    },

    link: function ($scope) {
      $scope.fields = searchSource.get('index').fields;
      // $scope.boolFilters = boolFilters();

      $scope.changeClause = function (fromClause, toClause, expression) {
        pull($scope.filter.bool[fromClause], expression);

        if ($scope.filter.bool[toClause] instanceof Array) {
          $scope.filter.bool[toClause].push(expression);
        } else {
          $scope.filter.bool[toClause] = [expression];
        }

        $scope.filter = angular.copy($scope.filter);
      };

      // function boolFilters() {
      //
      //   /**
      //    * Normalize
      //    *
      //    * TODO: migrate to helper lib
      //    * TODO: enforce array for type
      //    */
      //
      //   if ($scope.filter.query) {
      //     return {
      //       should: [
      //         $scope.filter.query
      //       ]
      //     };
      //   }
      //
      //   if ($scope.filter.bool) {
      //     return $scope.filter.bool;
      //   }
      //
      //   console.warn('only support for bool compound queries');
      // };
      //
      // window.boolFilters = $scope.boolFilters;
      // console.log($scope.boolFilters);
    }
  };
});
