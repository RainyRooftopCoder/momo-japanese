/**
 * 섹션 접기/펼치기 기능
 * 콘텐츠 섹션의 토글 동작을 관리
 */

function toggleSection(sectionId) {
    const section = document.querySelector('.' + sectionId).closest('.collapsible-section');
    const content = document.getElementById(sectionId + '-content');
    const icon = section.querySelector('.toggle-icon');

    section.classList.toggle('collapsed');

    if (section.classList.contains('collapsed')) {
        icon.textContent = '▶';
    } else {
        icon.textContent = '▼';
    }
}
